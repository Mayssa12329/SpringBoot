package com.medivet.helpanimal.service;

import com.medivet.helpanimal.model.ReportStatus;

/** Un signalement vient de changer d'etat : RescueCoordination doit en etre informe. */
public record MissionSyncEvent(Long reportId, ReportStatus status) {
}
