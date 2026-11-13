package com.medivet.helpanimal.service;

import java.util.List;

import com.medivet.helpanimal.domain.PriorityCalculator;
import com.medivet.helpanimal.domain.Report;
import com.medivet.helpanimal.domain.ReportStatusHistory;
import com.medivet.helpanimal.web.dto.ReportDetailResponse;
import com.medivet.helpanimal.web.dto.ReportSummaryResponse;
import com.medivet.helpanimal.web.dto.StatusHistoryResponse;
import org.springframework.stereotype.Component;

/** Conversion entite -> DTO, avec le score de priorite calcule a la lecture (RM01). */
@Component
public class ReportMapper {

    private final PriorityCalculator priorityCalculator;

    public ReportMapper(PriorityCalculator priorityCalculator) {
        this.priorityCalculator = priorityCalculator;
    }

    public ReportSummaryResponse toSummary(Report report, Long distanceMeters) {
        return new ReportSummaryResponse(
            report.getId(),
            report.getSpecies(),
            report.getCategory(),
            report.getSeverity(),
            report.getStatus(),
            report.getLatitude(),
            report.getLongitude(),
            report.getPhotoUrl(),
            report.getCreatedAt(),
            priorityCalculator.score(report),
            distanceMeters);
    }

    /** Vue complete : auteur, intervenant attribue, administrateur. */
    public ReportDetailResponse toFullDetail(Report report, List<ReportStatusHistory> history) {
        return new ReportDetailResponse(
            report.getId(),
            report.getSpecies(),
            report.getCategory(),
            report.getDescription(),
            report.getSeverity(),
            report.getPhotoUrl(),
            report.getLatitude(),
            report.getLongitude(),
            report.getStatus(),
            report.getCreatedAt(),
            report.getUpdatedAt(),
            report.getTakenChargeAt(),
            priorityCalculator.score(report),
            report.getReporterId(),
            report.getAssigneeId(),
            history.stream().map(StatusHistoryResponse::from).toList());
    }

    /** Vue publique : le statut est visible, pas l'historique ni les identifiants. */
    public ReportDetailResponse toPublicDetail(Report report) {
        return new ReportDetailResponse(
            report.getId(),
            report.getSpecies(),
            report.getCategory(),
            report.getDescription(),
            report.getSeverity(),
            report.getPhotoUrl(),
            report.getLatitude(),
            report.getLongitude(),
            report.getStatus(),
            report.getCreatedAt(),
            report.getUpdatedAt(),
            report.getTakenChargeAt(),
            priorityCalculator.score(report),
            null,
            null,
            null);
    }
}
