package com.medivet.rescue.service;

import java.time.Instant;

import com.medivet.rescue.model.Mission;
import com.medivet.rescue.model.MissionEventType;
import com.medivet.rescue.model.MissionStatus;

/** Instantane d'une mission au moment d'un evenement, diffuse apres la validation en base. */
public record MissionNotification(
    String missionId,
    Long reportId,
    MissionEventType type,
    MissionStatus status,
    Long intervenantId,
    double latitude,
    double longitude,
    int severity,
    String species,
    int reassignments,
    Instant occurredAt,
    String message) {

    static MissionNotification of(Mission mission, MissionEventType type, Long intervenantId,
                                  String message, Instant occurredAt) {
        return new MissionNotification(mission.getMissionId(), mission.getReportId(), type, mission.getStatus(),
            intervenantId, mission.getLatitude(), mission.getLongitude(), mission.getSeverity(),
            mission.getSpecies(), mission.getReassignments(), occurredAt, message);
    }
}
