package com.medivet.helpanimal.web.dto;

import java.time.Instant;

import com.medivet.helpanimal.domain.AuditLog;

/** Entree du journal d'audit (RM15). */
public record AuditLogResponse(
    Long id,
    String action,
    String targetType,
    Long targetId,
    Long actorId,
    String details,
    Instant createdAt) {

    public static AuditLogResponse from(AuditLog log) {
        return new AuditLogResponse(log.getId(), log.getAction(), log.getTargetType(),
            log.getTargetId(), log.getActorId(), log.getDetails(), log.getCreatedAt());
    }
}
