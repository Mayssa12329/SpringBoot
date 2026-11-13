package com.medivet.helpanimal.grpc;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.medivet.rescue.grpc.AssignMissionRequest;
import com.medivet.rescue.grpc.AssignMissionResponse;
import com.medivet.rescue.grpc.RescueCoordinationGrpc;
import io.grpc.stub.StreamObserver;

/**
 * Stub de RescueCoordinationService pour le sprint S3 (avant la livraison de US44-US47).
 * Il applique RM04 : une mission n'a qu'un intervenant, le premier arrive gagne.
 */
public class RescueCoordinationStubService extends RescueCoordinationGrpc.RescueCoordinationImplBase {

    private final Map<String, String> assignments = new ConcurrentHashMap<>();

    @Override
    public void assignMission(AssignMissionRequest request, StreamObserver<AssignMissionResponse> responseObserver) {
        String existing = assignments.putIfAbsent(request.getReportId(), request.getIntervenantId());

        AssignMissionResponse response;
        if (existing == null || existing.equals(request.getIntervenantId())) {
            response = AssignMissionResponse.newBuilder()
                .setResult(AssignMissionResponse.Result.ASSIGNED)
                .setMissionId("MIS-" + request.getReportId())
                .setMessage("Mission attribuee (stub)")
                .build();
        } else {
            response = AssignMissionResponse.newBuilder()
                .setResult(AssignMissionResponse.Result.ALREADY_ASSIGNED)
                .setMessage("Mission deja attribuee a l'intervenant " + existing)
                .build();
        }
        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }
}
