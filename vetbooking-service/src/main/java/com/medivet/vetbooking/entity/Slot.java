package com.medivet.vetbooking.entity;

import com.medivet.vetbooking.enums.SlotStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

/**
 * A time slot offered by a vet.
 *
 * Business rules:
 *  - RM06 : one slot → at most one CONFIRMED appointment (enforced by unique constraint + optimistic lock).
 *  - Closing a BOOKED slot must trigger rescheduling/notification (handled at service level).
 */
@Entity
@Table(
    name = "slots",
    uniqueConstraints = @UniqueConstraint(columnNames = {"vet_id", "start_time"})
)
public class Slot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "vet_id", nullable = false)
    private Vet vet;

    @NotNull
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @NotNull
    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SlotStatus status = SlotStatus.AVAILABLE;

    /**
     * Optimistic lock version — used to detect concurrent booking attempts (RM06).
     */
    @Version
    private Long version;

    // ── Constructors ────────────────────────────────────────────────────────

    public Slot() {}

    public Slot(Vet vet, LocalDateTime startTime, LocalDateTime endTime) {
        this.vet = vet;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    // ── Getters & Setters ───────────────────────────────────────────────────

    public Long getId() { return id; }

    public Vet getVet() { return vet; }
    public void setVet(Vet vet) { this.vet = vet; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public SlotStatus getStatus() { return status; }
    public void setStatus(SlotStatus status) { this.status = status; }

    public Long getVersion() { return version; }
}
