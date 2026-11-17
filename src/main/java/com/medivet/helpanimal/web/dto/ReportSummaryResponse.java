package com.medivet.helpanimal.web.dto;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.medivet.helpanimal.domain.ReportCategory;
import com.medivet.helpanimal.domain.ReportStatus;

/** Vue legere d'un signalement pour la carte (US21) et la liste proche (US22). */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ReportSummaryResponse(
    Long id,
    String species,
    ReportCategory category,
    int severity,
    ReportStatus status,
    double latitude,
    double longitude,
    String photoUrl,
    Instant createdAt,
    int priorityScore,
    Long distanceMeters) {
}
