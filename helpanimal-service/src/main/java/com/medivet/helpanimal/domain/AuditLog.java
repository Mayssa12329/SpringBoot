package com.medivet.helpanimal.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Journal des actions sensibles (RM15) : moderation, rejet. */
@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(name = "target_type", nullable = false, length = 50)
    private String targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(name = "actor_id", nullable = false)
    private Long actorId;

    @Column(length = 1000)
    private String details;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected AuditLog() {
        // requis par JPA
    }

    public AuditLog(String action, String targetType, Long targetId, Long actorId, String details, Instant createdAt) {
        this.action = action;
        this.targetType = targetType;
        this.targetId = targetId;
        this.actorId = actorId;
        this.details = details;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getAction() {
        return action;
    }

    public String getTargetType() {
        return targetType;
    }

    public Long getTargetId() {
        return targetId;
    }

    public Long getActorId() {
        return actorId;
    }

    public String getDetails() {
        return details;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
