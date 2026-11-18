package com.medivet.vetbooking.dto.response;

import com.medivet.vetbooking.enums.SlotStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "Time slot returned by the API")
public class SlotResponse {

    private Long id;
    private Long vetId;
    private String vetFullName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private SlotStatus status;

    // ── Getters & Setters ───────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getVetId() { return vetId; }
    public void setVetId(Long vetId) { this.vetId = vetId; }

    public String getVetFullName() { return vetFullName; }
    public void setVetFullName(String vetFullName) { this.vetFullName = vetFullName; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public SlotStatus getStatus() { return status; }
    public void setStatus(SlotStatus status) { this.status = status; }
}
