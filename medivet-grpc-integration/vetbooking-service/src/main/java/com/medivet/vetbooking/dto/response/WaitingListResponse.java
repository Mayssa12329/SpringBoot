package com.medivet.vetbooking.dto.response;

import com.medivet.vetbooking.enums.ConsultationType;
import com.medivet.vetbooking.enums.WaitingListStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "Waiting list entry returned by the API")
public class WaitingListResponse {

    private Long id;
    private Long slotId;
    private LocalDateTime slotStartTime;
    private Long vetId;
    private String vetFullName;
    private Long ownerId;
    private Long petId;
    private ConsultationType consultationType;
    private WaitingListStatus status;
    private LocalDateTime registeredAt;
    private LocalDateTime offerExpiresAt;

    // ── Getters & Setters ───────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }

    public LocalDateTime getSlotStartTime() { return slotStartTime; }
    public void setSlotStartTime(LocalDateTime slotStartTime) { this.slotStartTime = slotStartTime; }

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

    public WaitingListStatus getStatus() { return status; }
    public void setStatus(WaitingListStatus status) { this.status = status; }

    public LocalDateTime getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(LocalDateTime registeredAt) { this.registeredAt = registeredAt; }

    public LocalDateTime getOfferExpiresAt() { return offerExpiresAt; }
    public void setOfferExpiresAt(LocalDateTime offerExpiresAt) { this.offerExpiresAt = offerExpiresAt; }
}
