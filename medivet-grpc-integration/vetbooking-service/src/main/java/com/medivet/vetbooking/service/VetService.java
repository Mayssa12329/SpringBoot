package com.medivet.vetbooking.service;

import com.medivet.vetbooking.dto.VetBookingMapper;
import com.medivet.vetbooking.dto.request.SlotRequest;
import com.medivet.vetbooking.dto.request.VetRequest;
import com.medivet.vetbooking.dto.response.SlotResponse;
import com.medivet.vetbooking.dto.response.VetResponse;
import com.medivet.vetbooking.entity.Slot;
import com.medivet.vetbooking.entity.Vet;
import com.medivet.vetbooking.enums.ConsultationType;
import com.medivet.vetbooking.enums.SlotStatus;
import com.medivet.vetbooking.exception.DuplicateResourceException;
import com.medivet.vetbooking.exception.InvalidOperationException;
import com.medivet.vetbooking.exception.ResourceNotFoundException;
import com.medivet.vetbooking.repository.AppointmentRepository;
import com.medivet.vetbooking.repository.SlotRepository;
import com.medivet.vetbooking.repository.VetRepository;
import com.medivet.vetbooking.repository.WaitingListRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class VetService {

    private final VetRepository vetRepository;
    private final SlotRepository slotRepository;
    private final AppointmentRepository appointmentRepository;
    private final WaitingListRepository waitingListRepository;
    private final VetBookingMapper mapper;

    public VetService(VetRepository vetRepository,
                      SlotRepository slotRepository,
                      AppointmentRepository appointmentRepository,
                      WaitingListRepository waitingListRepository,
                      VetBookingMapper mapper) {
        this.vetRepository = vetRepository;
        this.slotRepository = slotRepository;
        this.appointmentRepository = appointmentRepository;
        this.waitingListRepository = waitingListRepository;
        this.mapper = mapper;
    }

    // ── Vet CRUD ─────────────────────────────────────────────────────────────

    @Transactional
    public VetResponse createVet(VetRequest request) {
        if (vetRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("A vet with email " + request.getEmail() + " already exists.");
        }
        Vet vet = new Vet();
        applyVetRequest(vet, request);
        return mapper.toVetResponse(vetRepository.save(vet));
    }

    public VetResponse getVet(Long id) {
        return mapper.toVetResponse(findVetOrThrow(id));
    }

    public List<VetResponse> searchVets(String city, ConsultationType consultationType) {
        List<Vet> vets;
        if (city != null && consultationType != null) {
            vets = vetRepository.findByActiveTrueAndCityIgnoreCaseAndConsultationType(city, consultationType);
        } else if (city != null) {
            vets = vetRepository.findByActiveTrueAndCityIgnoreCase(city);
        } else if (consultationType != null) {
            vets = vetRepository.findByActiveTrueAndConsultationType(consultationType);
        } else {
            vets = vetRepository.findByActiveTrue();
        }
        return vets.stream().map(mapper::toVetResponse).toList();
    }

    @Transactional
    public VetResponse updateVet(Long id, VetRequest request) {
        Vet vet = findVetOrThrow(id);
        if (!vet.getEmail().equalsIgnoreCase(request.getEmail())
                && vetRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email " + request.getEmail() + " is already in use.");
        }
        applyVetRequest(vet, request);
        return mapper.toVetResponse(vetRepository.save(vet));
    }

    @Transactional
    public void deactivateVet(Long id) {
        Vet vet = findVetOrThrow(id);
        vet.setActive(false);
        vetRepository.save(vet);
    }

    // ── Slot management (US14) ───────────────────────────────────────────────

    @Transactional
    public SlotResponse createSlot(Long vetId, SlotRequest request) {
        Vet vet = findVetOrThrow(vetId);
        if (request.getEndTime().isBefore(request.getStartTime()) ||
                request.getEndTime().isEqual(request.getStartTime())) {
            throw new InvalidOperationException("End time must be after start time.");
        }
        if (slotRepository.existsOverlappingSlot(vet, request.getStartTime(), request.getEndTime())) {
            throw new DuplicateResourceException(
                    "An overlapping slot already exists for vet " + vetId + " at the requested time.");
        }
        Slot slot = new Slot(vet, request.getStartTime(), request.getEndTime());
        return mapper.toSlotResponse(slotRepository.save(slot));
    }

    public List<SlotResponse> getSlotsByVet(Long vetId) {
        Vet vet = findVetOrThrow(vetId);
        return slotRepository.findByVet(vet).stream()
                .map(mapper::toSlotResponse)
                .toList();
    }

    public List<SlotResponse> getAvailableSlotsByVet(Long vetId, LocalDate date) {
        Vet vet = findVetOrThrow(vetId);
        return slotRepository.findAvailableByVetAndWindow(
                vet,
                date.atStartOfDay(),
                date.plusDays(1).atStartOfDay()
        ).stream()
         .map(mapper::toSlotResponse)
         .toList();
    }

    @Transactional
    public SlotResponse blockSlot(Long slotId) {
        Slot slot = findSlotOrThrow(slotId);
        if (slot.getStatus() == SlotStatus.BOOKED) {
            throw new InvalidOperationException(
                    "Cannot block a BOOKED slot (id=" + slotId + "). Cancel the appointment first.");
        }
        slot.setStatus(SlotStatus.BLOCKED);
        return mapper.toSlotResponse(slotRepository.save(slot));
    }

    @Transactional
    public SlotResponse openSlot(Long slotId) {
        Slot slot = findSlotOrThrow(slotId);
        if (slot.getStatus() == SlotStatus.BOOKED) {
            throw new InvalidOperationException("Slot " + slotId + " is already BOOKED.");
        }
        slot.setStatus(SlotStatus.AVAILABLE);
        return mapper.toSlotResponse(slotRepository.save(slot));
    }

    // ── Internal helpers ─────────────────────────────────────────────────────

    Vet findVetOrThrow(Long id) {
        return vetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vet", id));
    }

    Slot findSlotOrThrow(Long id) {
        return slotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Slot", id));
    }

    private void applyVetRequest(Vet vet, VetRequest req) {
        vet.setFirstName(req.getFirstName());
        vet.setLastName(req.getLastName());
        vet.setEmail(req.getEmail());
        vet.setPhone(req.getPhone());
        vet.setClinicName(req.getClinicName());
        vet.setAddress(req.getAddress());
        vet.setCity(req.getCity());
        vet.setLatitude(req.getLatitude());
        vet.setLongitude(req.getLongitude());
        vet.setConsultationType(req.getConsultationType());
    }
}
