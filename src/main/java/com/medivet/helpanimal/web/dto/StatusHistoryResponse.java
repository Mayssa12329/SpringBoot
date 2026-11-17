package com.medivet.helpanimal.web.dto;

import java.time.Instant;

import com.medivet.helpanimal.domain.ReportStatus;
import com.medivet.helpanimal.domain.ReportStatusHistory;

/** Une ligne d'historique (US24). */
public record StatusHistoryResponse(
    ReportStatus fromStatus,
    ReportStatus toStatus,
    Long actorId,
    String comment,
    Instant changedAt) {

    public static StatusHistoryResponse from(ReportStatusHistory history) {
        return new StatusHistoryResponse(history.getFromStatus(), history.getToStatus(),
            history.getActorId(), history.getComment(), history.getChangedAt());
    }
}
