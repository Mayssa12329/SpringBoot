package com.medivet.vetbooking.dto.request;

import com.medivet.vetbooking.enums.ConsultationType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Payload to book an appointment on a slot")
public class AppointmentRequest {

    @NotNull(message = "Slot ID is required")
    @Schema(example = "42")
    private Long slotId;

    @NotNull(message = "Owner ID is required")
    @Schema(example = "7")
    private Long ownerId;

    @Schema(example = "3")
    private Long petId;

    @NotNull(message = "Consultation type is required")
    @Schema(example = "GENERAL")
    private ConsultationType consultationType;

    @Schema(example = "Routine checkup for my dog")
    private String notes;

    // ── Getters & Setters ───────────────────────────────────────────────────

    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }

    public Long getOwnerId() { return ownerId; }
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }

    public Long getPetId() { return petId; }
    public void setPetId(Long petId) { this.petId = petId; }

    public ConsultationType getConsultationType() { return consultationType; }
    public void setConsultationType(ConsultationType consultationType) { this.consultationType = consultationType; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
