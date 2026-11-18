package com.medivet.vetbooking.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

@Schema(description = "Payload to create a time slot for a vet")
public class SlotRequest {

    @NotNull(message = "Start time is required")
    @Schema(example = "2026-11-10T09:00:00")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    @Schema(example = "2026-11-10T09:30:00")
    private LocalDateTime endTime;

    // ── Getters & Setters ───────────────────────────────────────────────────

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
}
