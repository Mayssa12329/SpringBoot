package com.medivet.vetbooking.service;

import com.medivet.petpass.model.MedicalRecord;
import com.medivet.petpass.model.VetAuthorization;
import com.medivet.petpass.service.AnimalService;
import com.medivet.petpass.service.MedicalRecordService;
import com.medivet.petpass.service.VetAuthorizationService;
import com.medivet.vetbooking.dto.VetBookingMapper;
import com.medivet.vetbooking.dto.request.AppointmentModifyRequest;
import com.medivet.vetbooking.dto.request.AppointmentRequest;
import com.medivet.vetbooking.dto.response.AppointmentResponse;
import com.medivet.vetbooking.entity.Appointment;
import com.medivet.vetbooking.entity.Slot;
import com.medivet.vetbooking.entity.Vet;
import com.medivet.vetbooking.enums.AppointmentStatus;
import com.medivet.vetbooking.enums.NotificationType;
import com.medivet.vetbooking.enums.SlotStatus;
import com.medivet.vetbooking.event.NotificationEvent;
import com.medivet.vetbooking.exception.IncompatibleConsultationTypeException;
import com.medivet.vetbooking.exception.InvalidOperationException;
import com.medivet.vetbooking.exception.ResourceNotFoundException;
import com.medivet.vetbooking.exception.SlotAlreadyBookedException;
import com.medivet.vetbooking.repository.AppointmentRepository;
import com.medivet.vetbooking.repository.SlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Handles appointment booking, modification and cancellation.
 *
 * Business rules enforced:
 *  - RM06 : one confirmed appointment per slot (pessimistic lock + status check)
 *  - RM07 : vet must support the requested consultation type
 *  - RM07 : late cancellation (< 2 h before start) -> status LATE_CANCELLED
 *  - RM08 : cancellation triggers waiting-list processing (delegated to WaitingListService)
 *  - RM09 : link with PetPassService (validates pet, grants vet authorization upon booking, records consultation on complete)
 *  - US17 : each state change publishes a NotificationEvent (persisted by NotificationService)
 */
@Service
@Transactional(readOnly = true)
public class AppointmentService {

    private static final int LATE_CANCELLATION_THRESHOLD_HOURS = 2;
    private static final DateTimeFormatter SLOT_FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final AppointmentRepository appointmentRepository;
    private final SlotRepository slotRepository;
    private final VetService vetService;
    private final WaitingListService waitingListService;
    private final VetBookingMapper mapper;
    private final ApplicationEventPublisher eventPublisher;

    @Autowired(required = false)
    private AnimalService animalService;

    @Autowired(required = false)
    private VetAuthorizationService vetAuthorizationService;

    @Autowired(required = false)
    private MedicalRecordService medicalRecordService;

    public AppointmentService(AppointmentRepository appointmentRepository,
                               SlotRepository slotRepository,
                               VetService vetService,
                               WaitingListService waitingListService,
                               VetBookingMapper mapper,
                               ApplicationEventPublisher eventPublisher) {
        this.appointmentRepository = appointmentRepository;
        this.slotRepository        = slotRepository;
        this.vetService            = vetService;
        this.waitingListService    = waitingListService;
        this.mapper                = mapper;
        this.eventPublisher        = eventPublisher;
    }

    // ── Book (US15) ───────────────────────────────────────────────────────────

    @Transactional
    public AppointmentResponse book(AppointmentRequest request) {
        Slot slot = slotRepository.findByIdWithLock(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Slot", request.getSlotId()));

        if (slot.getStatus() != SlotStatus.AVAILABLE) {
            throw new SlotAlreadyBookedException(slot.getId());
        }

        Vet vet = slot.getVet();
        if (vet.getConsultationType() != request.getConsultationType()) {
            throw new IncompatibleConsultationTypeException(
                    vet.getFirstName() + " " + vet.getLastName(),
                    request.getConsultationType().name());
        }

        // PetPass link: Validate animal existence if petId is provided
        if (request.getPetId() != null && animalService != null) {
            animalService.getAnimalById(request.getPetId())
                    .orElseThrow(() -> new ResourceNotFoundException("Animal", request.getPetId()));
        }

        Appointment appointment = new Appointment();
        appointment.setSlot(slot);
        appointment.setOwnerId(request.getOwnerId());
        appointment.setPetId(request.getPetId());
        appointment.setConsultationType(request.getConsultationType());
        appointment.setNotes(request.getNotes());
        appointment.setStatus(AppointmentStatus.CONFIRMED);

        slot.setStatus(SlotStatus.BOOKED);
        slotRepository.save(slot);
        Appointment saved = appointmentRepository.save(appointment);

        // PetPass link (US12 / RM09): Automatically grant vet authorization for this pet
        if (request.getPetId() != null && vetAuthorizationService != null) {
            try {
                if (!vetAuthorizationService.isVetAuthorized(request.getPetId(), vet.getId())) {
                    VetAuthorization auth = new VetAuthorization();
                    auth.setAnimalId(request.getPetId());
                    auth.setVeterinarianId(vet.getId());
                    auth.setVeterinarianName("Dr. " + vet.getFirstName() + " " + vet.getLastName());
                    auth.setGrantedDate(LocalDate.now());
                    auth.setExpiryDate(LocalDate.now().plusMonths(1));
                    auth.setStatus("Actif");
                    vetAuthorizationService.grantAccess(request.getPetId(), auth);
                }
            } catch (Exception e) {
                // Resilient error handling
            }
        }

        // US17 — notify owner of confirmation
        publishNotification(
                NotificationType.APPOINTMENT_CONFIRMED,
                request.getOwnerId(),
                saved.getId(),
                String.format("Votre rendez-vous avec Dr %s %s est confirmé pour le %s.",
                        vet.getFirstName(), vet.getLastName(),
                        slot.getStartTime().format(SLOT_FMT))
        );

        return mapper.toAppointmentResponse(saved);
    }

    // ── Get ───────────────────────────────────────────────────────────────────

    public AppointmentResponse getById(Long id) {
        return mapper.toAppointmentResponse(findOrThrow(id));
    }

    public List<AppointmentResponse> getByOwner(Long ownerId) {
        return appointmentRepository.findByOwnerId(ownerId)
                .stream().map(mapper::toAppointmentResponse).toList();
    }

    public List<AppointmentResponse> getByVet(Long vetId) {
        return appointmentRepository.findByVetId(vetId)
                .stream().map(mapper::toAppointmentResponse).toList();
    }

    // ── Modify / Reschedule (US16) ────────────────────────────────────────────

    @Transactional
    public AppointmentResponse modify(Long appointmentId, AppointmentModifyRequest request) {
        Appointment appointment = findOrThrow(appointmentId);

        if (appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new InvalidOperationException(
                    "Only CONFIRMED appointments can be modified. Current status: "
                    + appointment.getStatus());
        }

        // Notes-only update
        if (request.getNewSlotId() == null) {
            appointment.setNotes(request.getNotes());
            Appointment saved = appointmentRepository.save(appointment);

            // US17 — notify owner of notes change
            publishNotification(
                    NotificationType.APPOINTMENT_MODIFIED,
                    appointment.getOwnerId(),
                    saved.getId(),
                    String.format("Les notes de votre rendez-vous du %s ont été mises à jour.",
                            appointment.getSlot().getStartTime().format(SLOT_FMT))
            );

            return mapper.toAppointmentResponse(saved);
        }

        // Reschedule
        Slot oldSlot = appointment.getSlot();

        if (oldSlot.getId().equals(request.getNewSlotId())) {
            throw new InvalidOperationException(
                    "The new slot is the same as the current slot. No change made.");
        }

        Slot newSlot = slotRepository.findByIdWithLock(request.getNewSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Slot", request.getNewSlotId()));

        if (!newSlot.getVet().getId().equals(oldSlot.getVet().getId())) {
            throw new InvalidOperationException(
                    "Cannot reschedule to a different veterinarian. "
                    + "Cancel and create a new appointment instead.");
        }

        if (newSlot.getStatus() != SlotStatus.AVAILABLE) {
            throw new SlotAlreadyBookedException(newSlot.getId());
        }

        oldSlot.setStatus(SlotStatus.AVAILABLE);
        slotRepository.save(oldSlot);
        waitingListService.processNextInQueue(oldSlot);

        newSlot.setStatus(SlotStatus.BOOKED);
        slotRepository.save(newSlot);

        appointment.setSlot(newSlot);
        if (request.getNotes() != null) appointment.setNotes(request.getNotes());

        Appointment saved = appointmentRepository.save(appointment);
        Vet vet = newSlot.getVet();

        // US17 — notify owner of reschedule
        publishNotification(
                NotificationType.APPOINTMENT_MODIFIED,
                appointment.getOwnerId(),
                saved.getId(),
                String.format("Votre rendez-vous avec Dr %s %s a été déplacé au %s.",
                        vet.getFirstName(), vet.getLastName(),
                        newSlot.getStartTime().format(SLOT_FMT))
        );

        return mapper.toAppointmentResponse(saved);
    }

    // ── Cancel (US16) ─────────────────────────────────────────────────────────

    @Transactional
    public AppointmentResponse cancel(Long appointmentId) {
        Appointment appointment = findOrThrow(appointmentId);

        if (appointment.getStatus() != AppointmentStatus.CONFIRMED
                && appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new InvalidOperationException(
                    "Cannot cancel appointment " + appointmentId
                    + ". Current status: " + appointment.getStatus()
                    + ". Only CONFIRMED or PENDING appointments can be cancelled.");
        }

        LocalDateTime slotStart = appointment.getSlot().getStartTime();
        boolean isLate = LocalDateTime.now().isAfter(
                slotStart.minusHours(LATE_CANCELLATION_THRESHOLD_HOURS));

        appointment.setStatus(isLate
                ? AppointmentStatus.LATE_CANCELLED
                : AppointmentStatus.CANCELLED);

        Slot slot = appointment.getSlot();
        slot.setStatus(SlotStatus.AVAILABLE);
        slotRepository.save(slot);

        Appointment saved = appointmentRepository.save(appointment);
        waitingListService.processNextInQueue(slot);

        // US17 — notify owner of cancellation
        String msg = isLate
                ? String.format("Votre rendez-vous du %s a été annulé tardivement (< 2 h avant l'heure).",
                        slotStart.format(SLOT_FMT))
                : String.format("Votre rendez-vous du %s a été annulé.",
                        slotStart.format(SLOT_FMT));

        publishNotification(
                NotificationType.APPOINTMENT_CANCELLED,
                appointment.getOwnerId(),
                saved.getId(),
                msg
        );

        return mapper.toAppointmentResponse(saved);
    }

    // ── Complete (US09 / E09) ─────────────────────────────────────────────────

    @Transactional
    public AppointmentResponse complete(Long appointmentId) {
        Appointment appointment = findOrThrow(appointmentId);
        if (appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new InvalidOperationException(
                    "Only CONFIRMED appointments can be marked as completed.");
        }
        appointment.setStatus(AppointmentStatus.COMPLETED);
        Appointment saved = appointmentRepository.save(appointment);

        // PetPass link (US09 / E09): Record consultation in animal's medical record upon completion
        if (saved.getPetId() != null && medicalRecordService != null) {
            try {
                Vet vet = saved.getSlot().getVet();
                MedicalRecord record = new MedicalRecord();
                record.setAnimalId(saved.getPetId());
                record.setConsultationDate(saved.getSlot().getStartTime());
                record.setDiagnosis("Consultation " + saved.getConsultationType().name());
                record.setTreatment(saved.getNotes() != null ? saved.getNotes() : "Visite clinique complétée.");
                record.setVeterinarianName("Dr. " + vet.getFirstName() + " " + vet.getLastName());
                record.setNotes("Rendez-vous #" + saved.getId() + " complété via VetBooking.");
                medicalRecordService.addMedicalRecord(saved.getPetId(), record);
            } catch (Exception e) {
                // Non-blocking log
            }
        }

        return mapper.toAppointmentResponse(saved);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Appointment findOrThrow(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
    }

    /**
     * Builds and publishes a NotificationEvent.
     * The idempotency key is: "<type>-<appointmentId>-<recipientId>"
     */
    private void publishNotification(NotificationType type, Long recipientId,
                                     Long appointmentId, String message) {
        NotificationEvent event = NotificationEvent.builder(this)
                .type(type)
                .recipientId(recipientId)
                .referenceId(appointmentId)
                .message(message)
                .autoKey()
                .build();
        eventPublisher.publishEvent(event);
    }
}
