package com.medivet.vetbooking.entity;

import com.medivet.vetbooking.enums.AppointmentStatus;
import com.medivet.vetbooking.enums.ConsultationType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

/**
 * A booking made by an owner for a specific vet slot.
 *
 * Business rules enforced here / at service level:
 *  - RM06 : unique constraint on slot_id ensures one confirmed appointment per slot.
 *  - RM07 : consultation type must be in the vet's supported types.
 *  - RM07 : late cancellation (< 2 h before start) is flagged as LATE_CANCELLED.
 *  - RM08 : cancellation triggers waiting-list processing.
 */
@Entity
@Table(
    name = "appointments",
    uniqueConstraints = @UniqueConstraint(name = "uq_slot_confirmed", columnNames = "slot_id")
)
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The time slot this appointment occupies.
     * One-to-one at the DB level via unique constraint (RM06).
     */
    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id", nullable = false)
    private Slot slot;

    /** ID of the owner (from UserService — stored by reference, no FK). */
    @NotNull
    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    /** ID of the pet (from PetPassService — stored by reference, no FK). */
    @Column(name = "pet_id")
    private Long petId;

    @Enumerated(EnumType.STRING)
    @Column(name = "consultation_type", nullable = false)
    private ConsultationType consultationType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status = AppointmentStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    private void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ── Constructors ────────────────────────────────────────────────────────

    public Appointment() {}

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

    public AppointmentStatus getStatus() { return status; }
    public void setStatus(AppointmentStatus status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
