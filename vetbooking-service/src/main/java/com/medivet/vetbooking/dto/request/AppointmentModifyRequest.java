package com.medivet.vetbooking.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * Payload for modifying an existing CONFIRMED appointment (US16).
 *
 * The owner can change:
 *  - the slot (reschedule) — new slot must be AVAILABLE on the same vet
 *  - the notes
 *
 * The consultation type is NOT modifiable after booking (RM07 — it is tied to the vet).
 */
@Schema(description = "Payload to modify an existing appointment (reschedule or update notes)")
public class AppointmentModifyRequest {

    /**
     * ID of the new slot to move the appointment to.
     * If null, the slot is kept unchanged (only notes are updated).
     */
    @Schema(example = "55", description = "New slot ID (optional — omit to keep the current slot)")
    private Long newSlotId;

    @Schema(example = "Follow-up visit after treatment")
    private String notes;

    // ── Getters & Setters ───────────────────────────────────────────────────

    public Long getNewSlotId() { return newSlotId; }
    public void setNewSlotId(Long newSlotId) { this.newSlotId = newSlotId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
