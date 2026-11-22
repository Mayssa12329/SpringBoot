package com.medivet.vetbooking.dto.response;

import com.medivet.vetbooking.enums.AppointmentStatus;
import com.medivet.vetbooking.enums.ConsultationType;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "Appointment returned by the API")
public class AppointmentResponse {

    private Long id;
    private Long slotId;
    private LocalDateTime slotStartTime;
    private LocalDateTime slotEndTime;
    private Long vetId;
    private String vetFullName;
    private Long ownerId;
    private Long petId;
    private ConsultationType consultationType;
    private AppointmentStatus status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ── Getters & Setters ───────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }

    public LocalDateTime getSlotStartTime() { return slotStartTime; }
    public void setSlotStartTime(LocalDateTime slotStartTime) { this.slotStartTime = slotStartTime; }

    public LocalDateTime getSlotEndTime() { return slotEndTime; }
    public void setSlotEndTime(LocalDateTime slotEndTime) { this.slotEndTime = slotEndTime; }

    public Long getVetId() { return vetId; }
    public void setVetId(Long vetId) { this.vetId = vetId; }

    public String getVetFullName() { return vetFullName; }
    public void setVetFullName(String vetFullName) { this.vetFullName = vetFullName; }

    public Long getOwnerId() { return ownerId; }
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }

    public Long getPetId() { return petId; }
    public void setPetId(Long petId) { this.petId = petId; }

    public ConsultationType getConsultationType() { return consultationType; }
    public void setConsultationType(ConsultationType consultationType) { this.consultationType = consultationType; }

    public AppointmentStatus getStatus() { return status; }
    public void setStatus(AppointmentStatus status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
