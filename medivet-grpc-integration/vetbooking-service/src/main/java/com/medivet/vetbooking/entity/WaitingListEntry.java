package com.medivet.vetbooking.entity;

import com.medivet.vetbooking.enums.ConsultationType;
import com.medivet.vetbooking.enums.WaitingListStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

/**
 * An entry in the waiting list for a specific vet slot.
 *
 * Business rules:
 *  - RM08 : FIFO order — entries are sorted by {@code registeredAt}.
 *  - RM08 : When a slot is freed, the first WAITING entry transitions to OFFERED.
 *  - RM08 : The offer is valid for 30 minutes ({@code offerExpiresAt}); if not accepted, status → EXPIRED
 *           and the next entry receives the offer.
 */
@Entity
@Table(name = "waiting_list_entries")
public class WaitingListEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id", nullable = false)
    private Slot slot;

    /** ID of the owner waiting for this slot. */
    @NotNull
    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    /** ID of the pet (optional at registration time). */
    @Column(name = "pet_id")
    private Long petId;

    @Enumerated(EnumType.STRING)
    @Column(name = "consultation_type", nullable = false)
    private ConsultationType consultationType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WaitingListStatus status = WaitingListStatus.WAITING;

    /** Timestamp used for FIFO ordering (RM08). */
    @NotNull
    @Column(name = "registered_at", nullable = false, updatable = false)
    private LocalDateTime registeredAt = LocalDateTime.now();

    /**
     * Set when status transitions to OFFERED.
     * The offer expires 30 minutes after this timestamp (RM08).
     */
    @Column(name = "offer_expires_at")
    private LocalDateTime offerExpiresAt;

    // ── Constructors ────────────────────────────────────────────────────────

    public WaitingListEntry() {}

    // ── Getters & Setters ───────────────────────────────────────────────────

    public Long getId() { return id; }

    public Slot getSlot() { return slot; }
    public void setSlot(Slot slot) { this.slot = slot; }

    public Long getOwnerId() { return ownerId; }
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }

    public Long getPetId() { return petId; }
    public void setPetId(Long petId) { this.petId = petId; }

    public ConsultationType getConsultationType() { return consultationType; }
    public void setConsultationType(ConsultationType consultationType) { this.consultationType = consultationType; }

    public WaitingListStatus getStatus() { return status; }
    public void setStatus(WaitingListStatus status) { this.status = status; }

    public LocalDateTime getRegisteredAt() { return registeredAt; }

    public LocalDateTime getOfferExpiresAt() { return offerExpiresAt; }
    public void setOfferExpiresAt(LocalDateTime offerExpiresAt) { this.offerExpiresAt = offerExpiresAt; }
}
