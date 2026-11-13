package com.medivet.helpanimal.web.dto;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.medivet.helpanimal.domain.ReportCategory;
import com.medivet.helpanimal.domain.ReportStatus;

/**
 * Detail d'un signalement. reporterId, assigneeId et history ne sont remplis que pour
 * l'auteur, l'intervenant attribue et l'administrateur (US24 : "selon les droits").
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ReportDetailResponse(
    Long id,
    String species,
    ReportCategory category,
    String description,
    int severity,
    String photoUrl,
    double latitude,
    double longitude,
    ReportStatus status,
    Instant createdAt,
    Instant updatedAt,
    Instant takenChargeAt,
    int priorityScore,
    Long reporterId,
    Long assigneeId,
    List<StatusHistoryResponse> history) {
}
