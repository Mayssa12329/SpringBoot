package com.medivet.rescue.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Historique d'une mission (diffusion, acceptation, desistement, reattribution...). */
@Entity
@Table(name = "mission_event")
public class MissionEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mission_id", nullable = false)
    private Long missionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MissionEventType type;

    @Column(name = "intervenant_id")
    private Long intervenantId;

    @Column(length = 500)
    private String message;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    protected MissionEvent() {
        // requis par JPA
    }

    public MissionEvent(Long missionId, MissionEventType type, Long intervenantId, String message, Instant occurredAt) {
        this.missionId = missionId;
        this.type = type;
        this.intervenantId = intervenantId;
        this.message = message;
        this.occurredAt = occurredAt;
    }

    public MissionEventType getType() {
        return type;
    }

    public Long getIntervenantId() {
        return intervenantId;
    }

    public String getMessage() {
        return message;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }
}
