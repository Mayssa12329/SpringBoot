package com.medivet.vetbooking.service;

import com.medivet.vetbooking.dto.VetBookingMapper;
import com.medivet.vetbooking.dto.request.WaitingListRequest;
import com.medivet.vetbooking.dto.response.WaitingListResponse;
import com.medivet.vetbooking.entity.Appointment;
import com.medivet.vetbooking.entity.Slot;
import com.medivet.vetbooking.entity.WaitingListEntry;
import com.medivet.vetbooking.enums.AppointmentStatus;
import com.medivet.vetbooking.enums.NotificationType;
import com.medivet.vetbooking.enums.SlotStatus;
import com.medivet.vetbooking.enums.WaitingListStatus;
import com.medivet.vetbooking.event.NotificationEvent;
import com.medivet.vetbooking.exception.DuplicateResourceException;
import com.medivet.vetbooking.exception.InvalidOperationException;
import com.medivet.vetbooking.exception.ResourceNotFoundException;
import com.medivet.vetbooking.exception.SlotAlreadyBookedException;
import com.medivet.vetbooking.repository.AppointmentRepository;
import com.medivet.vetbooking.repository.SlotRepository;
import com.medivet.vetbooking.repository.WaitingListRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

/**
 * Manages the waiting list for booked/blocked slots (US18).
 *
 * Business rules:
 *  - RM08 : FIFO — first WAITING entry is offered when a slot is freed.
 *  - RM08 : Offer window is 30 minutes.
 *  - RM08 : Accepting creates a real Appointment + marks slot BOOKED.
 *  - US17 : WAITING_LIST_OFFER event published when an offer is sent.
 */
@Service
@Transactional(readOnly = true)
public class WaitingListService {

    private static final Logger log = LoggerFactory.getLogger(WaitingListService.class);
    private static final int OFFER_VALIDITY_MINUTES = 30;
    private static final DateTimeFormatter SLOT_FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final WaitingListRepository waitingListRepository;
    private final SlotRepository slotRepository;
    private final AppointmentRepository appointmentRepository;
    private final VetBookingMapper mapper;
    private final ApplicationEventPublisher eventPublisher;

    public WaitingListService(WaitingListRepository waitingListRepository,
                               SlotRepository slotRepository,
                               AppointmentRepository appointmentRepository,
                               VetBookingMapper mapper,
                               ApplicationEventPublisher eventPublisher) {
        this.waitingListRepository = waitingListRepository;
        this.slotRepository        = slotRepository;
        this.appointmentRepository = appointmentRepository;
        this.mapper                = mapper;
        this.eventPublisher        = eventPublisher;
    }

    // ── Join (US18) ───────────────────────────────────────────────────────────

    @Transactional
    public WaitingListResponse join(WaitingListRequest request) {
        Slot slot = slotRepository.findById(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Slot", request.getSlotId()));

        if (waitingListRepository.existsActiveEntryForOwnerAndSlot(slot, request.getOwnerId())) {
            throw new DuplicateResourceException(
                    "Owner " + request.getOwnerId()
                    + " is already on the waiting list for slot " + slot.getId());
        }

        WaitingListEntry entry = new WaitingListEntry();
        entry.setSlot(slot);
        entry.setOwnerId(request.getOwnerId());
        entry.setPetId(request.getPetId());
        entry.setConsultationType(request.getConsultationType());
        entry.setStatus(WaitingListStatus.WAITING);

        return mapper.toWaitingListResponse(waitingListRepository.save(entry));
    }

    // ── Accept offer (US18) ───────────────────────────────────────────────────

    @Transactional
    public WaitingListResponse acceptOffer(Long entryId) {
        WaitingListEntry entry = findOrThrow(entryId);

        if (entry.getStatus() != WaitingListStatus.OFFERED) {
            throw new InvalidOperationException(
                    "Entry " + entryId + " is not in OFFERED status.");
        }

        if (entry.getOfferExpiresAt() != null
                && LocalDateTime.now().isAfter(entry.getOfferExpiresAt())) {
            expireEntryAndAdvanceQueue(entryId);
            throw new InvalidOperationException(
                    "The offer for entry " + entryId + " has expired. "
                    + "The next person in the queue has been notified.");
        }

        Slot slot = slotRepository.findByIdWithLock(entry.getSlot().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Slot", entry.getSlot().getId()));

        if (slot.getStatus() != SlotStatus.AVAILABLE) {
            expireEntryAndAdvanceQueue(entryId);
            throw new SlotAlreadyBookedException(slot.getId());
        }

        slot.setStatus(SlotStatus.BOOKED);
        slotRepository.save(slot);

        Appointment appointment = new Appointment();
        appointment.setSlot(slot);
        appointment.setOwnerId(entry.getOwnerId());
        appointment.setPetId(entry.getPetId());
        appointment.setConsultationType(entry.getConsultationType());
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        Appointment saved = appointmentRepository.save(appointment);

        entry.setStatus(WaitingListStatus.ACCEPTED);
        waitingListRepository.save(entry);

        log.info("Waiting-list entry {} accepted — appointment {} created for slot {}",
                entryId, saved.getId(), slot.getId());

        // US17 — confirm appointment created from waiting list
        publishOffer(NotificationType.APPOINTMENT_CONFIRMED,
                entry.getOwnerId(), saved.getId(),
                String.format("Votre proposition de créneau du %s a été acceptée. Rendez-vous confirmé.",
                        slot.getStartTime().format(SLOT_FMT)));

        return mapper.toWaitingListResponse(entry);
    }

    // ── Cancel entry ──────────────────────────────────────────────────────────

    @Transactional
    public WaitingListResponse cancel(Long entryId) {
        WaitingListEntry entry = findOrThrow(entryId);

        if (entry.getStatus() == WaitingListStatus.ACCEPTED
                || entry.getStatus() == WaitingListStatus.CANCELLED) {
            throw new InvalidOperationException(
                    "Entry " + entryId + " cannot be cancelled in its current state.");
        }

        boolean wasOffered = entry.getStatus() == WaitingListStatus.OFFERED;
        entry.setStatus(WaitingListStatus.CANCELLED);
        waitingListRepository.save(entry);

        if (wasOffered) processNextInQueue(entry.getSlot());

        return mapper.toWaitingListResponse(entry);
    }

    // ── Query ─────────────────────────────────────────────────────────────────

    public List<WaitingListResponse> getByOwner(Long ownerId) {
        return waitingListRepository.findByOwnerId(ownerId).stream()
                .map(mapper::toWaitingListResponse).toList();
    }

    public List<WaitingListResponse> getBySlot(Long slotId) {
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot", slotId));
        return waitingListRepository.findBySlotOrderByRegisteredAtAsc(slot).stream()
                .map(mapper::toWaitingListResponse).toList();
    }

    // ── FIFO offer (RM08) ─────────────────────────────────────────────────────

    /**
     * Offers the freed slot to the first WAITING entry.
     * Publishes a WAITING_LIST_OFFER notification (US17).
     */
    @Transactional
    public void processNextInQueue(Slot slot) {
        Optional<WaitingListEntry> nextOpt =
                waitingListRepository.findFirstWaitingForSlot(slot);

        nextOpt.ifPresent(next -> {
            LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(OFFER_VALIDITY_MINUTES);
            next.setStatus(WaitingListStatus.OFFERED);
            next.setOfferExpiresAt(expiresAt);
            WaitingListEntry saved = waitingListRepository.save(next);

            log.info("[US18] Offer sent → owner={} slot={} expires={}",
                    next.getOwnerId(), slot.getId(), expiresAt);

            // US17 — notify the owner that a slot is available for them
            publishOffer(NotificationType.WAITING_LIST_OFFER,
                    next.getOwnerId(), saved.getId(),
                    String.format(
                        "Un créneau du %s est disponible pour vous. "
                        + "Vous avez 30 minutes pour accepter (entrée #%d).",
                        slot.getStartTime().format(SLOT_FMT), saved.getId()));
        });
    }

    // ── Scheduled expiry (RM08) ───────────────────────────────────────────────

    @Scheduled(fixedDelayString = "${vetbooking.waiting-list.expiry-check-ms:60000}")
    public void expireStaleOffers() {
        List<Long> expiredIds = waitingListRepository
                .findExpiredOffers(LocalDateTime.now())
                .stream().map(WaitingListEntry::getId).toList();

        for (Long id : expiredIds) {
            try {
                expireEntryAndAdvanceQueue(id);
            } catch (Exception e) {
                log.warn("Failed to expire waiting-list entry {}: {}", id, e.getMessage());
            }
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void expireEntryAndAdvanceQueue(Long entryId) {
        WaitingListEntry entry = waitingListRepository.findById(entryId).orElse(null);
        if (entry == null || entry.getStatus() != WaitingListStatus.OFFERED) return;

        entry.setStatus(WaitingListStatus.EXPIRED);
        waitingListRepository.save(entry);
        log.info("[US18] Entry {} expired", entryId);

        processNextInQueue(entry.getSlot());
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    private WaitingListEntry findOrThrow(Long id) {
        return waitingListRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WaitingListEntry", id));
    }

    /**
     * Publishes a NotificationEvent for waiting-list events.
     * Key format: "<type>-<entryOrAppointmentId>-<recipientId>"
     */
    private void publishOffer(NotificationType type, Long recipientId,
                               Long referenceId, String message) {
        NotificationEvent event = NotificationEvent.builder(this)
                .type(type)
                .recipientId(recipientId)
                .referenceId(referenceId)
                .message(message)
                .autoKey()
                .build();
        eventPublisher.publishEvent(event);
    }
}
