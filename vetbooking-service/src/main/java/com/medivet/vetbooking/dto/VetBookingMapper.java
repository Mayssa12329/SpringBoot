package com.medivet.vetbooking.dto;

import com.medivet.vetbooking.dto.response.AppointmentResponse;
import com.medivet.vetbooking.dto.response.SlotResponse;
import com.medivet.vetbooking.dto.response.VetResponse;
import com.medivet.vetbooking.dto.response.WaitingListResponse;
import com.medivet.vetbooking.entity.Appointment;
import com.medivet.vetbooking.entity.Slot;
import com.medivet.vetbooking.entity.Vet;
import com.medivet.vetbooking.entity.WaitingListEntry;
import org.springframework.stereotype.Component;

/**
 * Manual mapper between JPA entities and API response DTOs.
 * Keeps controllers and services free of mapping logic.
 */
@Component
public class VetBookingMapper {

    public VetResponse toVetResponse(Vet vet) {
        VetResponse r = new VetResponse();
        r.setId(vet.getId());
        r.setFirstName(vet.getFirstName());
        r.setLastName(vet.getLastName());
        r.setEmail(vet.getEmail());
        r.setPhone(vet.getPhone());
        r.setClinicName(vet.getClinicName());
        r.setAddress(vet.getAddress());
        r.setCity(vet.getCity());
        r.setLatitude(vet.getLatitude());
        r.setLongitude(vet.getLongitude());
        r.setConsultationType(vet.getConsultationType());
        r.setActive(vet.isActive());
        return r;
    }

    public SlotResponse toSlotResponse(Slot slot) {
        SlotResponse r = new SlotResponse();
        r.setId(slot.getId());
        r.setVetId(slot.getVet().getId());
        r.setVetFullName(slot.getVet().getFirstName() + " " + slot.getVet().getLastName());
        r.setStartTime(slot.getStartTime());
        r.setEndTime(slot.getEndTime());
        r.setStatus(slot.getStatus());
        return r;
    }

    public AppointmentResponse toAppointmentResponse(Appointment appt) {
        AppointmentResponse r = new AppointmentResponse();
        r.setId(appt.getId());
        r.setSlotId(appt.getSlot().getId());
        r.setSlotStartTime(appt.getSlot().getStartTime());
        r.setSlotEndTime(appt.getSlot().getEndTime());
        r.setVetId(appt.getSlot().getVet().getId());
        r.setVetFullName(appt.getSlot().getVet().getFirstName() + " " + appt.getSlot().getVet().getLastName());
        r.setOwnerId(appt.getOwnerId());
        r.setPetId(appt.getPetId());
        r.setConsultationType(appt.getConsultationType());
        r.setStatus(appt.getStatus());
        r.setNotes(appt.getNotes());
        r.setCreatedAt(appt.getCreatedAt());
        r.setUpdatedAt(appt.getUpdatedAt());
        return r;
    }

    public WaitingListResponse toWaitingListResponse(WaitingListEntry entry) {
        WaitingListResponse r = new WaitingListResponse();
        r.setId(entry.getId());
        r.setSlotId(entry.getSlot().getId());
        r.setSlotStartTime(entry.getSlot().getStartTime());
        r.setVetId(entry.getSlot().getVet().getId());
        r.setVetFullName(entry.getSlot().getVet().getFirstName() + " " + entry.getSlot().getVet().getLastName());
        r.setOwnerId(entry.getOwnerId());
        r.setPetId(entry.getPetId());
        r.setConsultationType(entry.getConsultationType());
        r.setStatus(entry.getStatus());
        r.setRegisteredAt(entry.getRegisteredAt());
        r.setOfferExpiresAt(entry.getOfferExpiresAt());
        return r;
    }
}
