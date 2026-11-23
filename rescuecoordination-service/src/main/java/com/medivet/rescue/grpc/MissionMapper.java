package com.medivet.rescue.grpc;

import com.medivet.rescue.model.Mission;
import com.medivet.rescue.service.MissionNotification;

/** Conversion entre le modele du service et les messages du contrat gRPC. */
final class MissionMapper {

    private MissionMapper() {
    }

    static MissionStatus toProto(com.medivet.rescue.model.MissionStatus status) {
        return switch (status) {
            case OPEN -> MissionStatus.MISSION_OPEN;
            case ASSIGNED -> MissionStatus.MISSION_ASSIGNED;
            case IN_PROGRESS -> MissionStatus.MISSION_IN_PROGRESS;
            case COMPLETED -> MissionStatus.MISSION_COMPLETED;
            case ESCALATED -> MissionStatus.MISSION_ESCALATED;
        };
    }

    static com.medivet.rescue.model.MissionStatus fromProto(MissionStatus status) {
        return switch (status) {
            case MISSION_OPEN -> com.medivet.rescue.model.MissionStatus.OPEN;
            case MISSION_ASSIGNED -> com.medivet.rescue.model.MissionStatus.ASSIGNED;
            case MISSION_IN_PROGRESS -> com.medivet.rescue.model.MissionStatus.IN_PROGRESS;
            case MISSION_COMPLETED -> com.medivet.rescue.model.MissionStatus.COMPLETED;
            case MISSION_ESCALATED -> com.medivet.rescue.model.MissionStatus.ESCALATED;
            default -> throw new IllegalArgumentException("Statut de mission absent ou inconnu");
        };
    }

    static MissionEventType toProto(com.medivet.rescue.model.MissionEventType type) {
        return switch (type) {
            case PUBLISHED -> MissionEventType.EVENT_PUBLISHED;
            case ASSIGNED -> MissionEventType.EVENT_ASSIGNED;
            case DECLINED -> MissionEventType.EVENT_DECLINED;
            case REASSIGNED -> MissionEventType.EVENT_REASSIGNED;
            case ESCALATED -> MissionEventType.EVENT_ESCALATED;
            case IN_PROGRESS -> MissionEventType.EVENT_IN_PROGRESS;
            case COMPLETED -> MissionEventType.EVENT_COMPLETED;
        };
    }

    static MissionReply reply(Mission mission, String message) {
        return MissionReply.newBuilder()
            .setMissionId(mission.getMissionId())
            .setStatus(toProto(mission.getStatus()))
            .setReassignments(mission.getReassignments())
            .setMessage(message)
            .build();
    }

    static MissionEvent toProto(MissionNotification notification) {
        MissionEvent.Builder event = MissionEvent.newBuilder()
            .setMissionId(notification.missionId())
            .setReportId(String.valueOf(notification.reportId()))
            .setType(toProto(notification.type()))
            .setStatus(toProto(notification.status()))
            .setLatitude(notification.latitude())
            .setLongitude(notification.longitude())
            .setSeverity(notification.severity())
            .setReassignments(notification.reassignments())
            .setOccurredAt(notification.occurredAt().toString())
            .setMessage(notification.message());
        if (notification.intervenantId() != null) {
            event.setIntervenantId(String.valueOf(notification.intervenantId()));
        }
        return event.build();
    }
}
