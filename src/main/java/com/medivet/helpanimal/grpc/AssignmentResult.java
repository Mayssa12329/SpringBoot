package com.medivet.helpanimal.grpc;

import com.medivet.rescue.grpc.AssignMissionResponse;

/** Reponse de RescueCoordination, independante des classes generees par protoc. */
public record AssignmentResult(Outcome outcome, String missionId, String message) {

    public enum Outcome {
        ASSIGNED,
        ALREADY_ASSIGNED,
        REJECTED
    }

    static AssignmentResult from(AssignMissionResponse response) {
        Outcome outcome = switch (response.getResult()) {
            case ASSIGNED -> Outcome.ASSIGNED;
            case ALREADY_ASSIGNED -> Outcome.ALREADY_ASSIGNED;
            default -> Outcome.REJECTED;
        };
        return new AssignmentResult(outcome, response.getMissionId(), response.getMessage());
    }
}
