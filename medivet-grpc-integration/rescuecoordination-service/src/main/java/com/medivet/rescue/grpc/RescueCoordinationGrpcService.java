package com.medivet.rescue.grpc;

import java.time.Clock;
import java.util.EnumSet;
import java.util.Set;
import java.util.function.Supplier;

import com.medivet.rescue.model.Mission;
import com.medivet.rescue.service.MissionNotFoundException;
import com.medivet.rescue.service.MissionService;
import com.medivet.rescue.service.MissionStateException;
import com.medivet.rescue.service.TrackingService;
import io.grpc.Status;
import io.grpc.stub.ServerCallStreamObserver;
import io.grpc.stub.StreamObserver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Implementation du contrat rescue_coordination.proto : RPC unaires, server streaming (WatchMissions),
 * client streaming (TrackMission) et bidirectionnel (Dispatch).
 * Erreurs : argument invalide -> INVALID_ARGUMENT, mission inconnue -> NOT_FOUND,
 * operation impossible dans l'etat actuel -> FAILED_PRECONDITION.
 * Les refus metier de l'affectation (deja attribuee, escalade) sont des reponses, pas des erreurs.
 */
@Component
public class RescueCoordinationGrpcService extends RescueCoordinationGrpc.RescueCoordinationImplBase {

    private static final Logger log = LoggerFactory.getLogger(RescueCoordinationGrpcService.class);

    private final MissionService missionService;
    private final MissionEventBroadcaster broadcaster;
    private final TrackingService trackingService;
    private final Clock clock;

    public RescueCoordinationGrpcService(MissionService missionService, MissionEventBroadcaster broadcaster,
                                         TrackingService trackingService, Clock clock) {
        this.missionService = missionService;
        this.broadcaster = broadcaster;
        this.trackingService = trackingService;
        this.clock = clock;
    }

    @Override
    public void publishMission(PublishMissionRequest request, StreamObserver<MissionReply> responseObserver) {
        respond(responseObserver, () -> {
            Mission mission = missionService.publish(id(request.getReportId(), "report_id"), request.getLatitude(),
                request.getLongitude(), severity(request.getSeverity()), blankToNull(request.getSpecies()));
            return MissionMapper.reply(mission, "Mission diffusee");
        });
    }

    @Override
    public void assignMission(AssignMissionRequest request, StreamObserver<AssignMissionResponse> responseObserver) {
        respond(responseObserver, () -> {
            MissionService.AssignOutcome outcome = missionService.assign(id(request.getReportId(), "report_id"),
                id(request.getIntervenantId(), "intervenant_id"), request.getLatitude(), request.getLongitude(),
                severity(request.getSeverity()));
            AssignMissionResponse.Builder response = AssignMissionResponse.newBuilder()
                .setResult(switch (outcome.result()) {
                    case ASSIGNED -> AssignMissionResponse.Result.ASSIGNED;
                    case ALREADY_ASSIGNED -> AssignMissionResponse.Result.ALREADY_ASSIGNED;
                    case REJECTED -> AssignMissionResponse.Result.REJECTED;
                })
                .setMessage(outcome.message());
            if (outcome.missionId() != null) {
                response.setMissionId(outcome.missionId());
            }
            return response.build();
        });
    }

    @Override
    public void declineMission(DeclineMissionRequest request, StreamObserver<MissionReply> responseObserver) {
        respond(responseObserver, () -> {
            Mission mission = missionService.decline(id(request.getReportId(), "report_id"),
                id(request.getIntervenantId(), "intervenant_id"), request.getReason());
            return MissionMapper.reply(mission, mission.getStatus() == com.medivet.rescue.model.MissionStatus.ESCALATED
                ? "Mission en escalade vers l'administrateur" : "Mission rediffusee aux intervenants");
        });
    }

    @Override
    public void updateMissionStatus(UpdateMissionStatusRequest request, StreamObserver<MissionReply> responseObserver) {
        respond(responseObserver, () -> {
            Long intervenantId = request.getIntervenantId().isBlank() ? null : id(request.getIntervenantId(), "intervenant_id");
            Mission mission = missionService.updateStatus(id(request.getReportId(), "report_id"), intervenantId,
                MissionMapper.fromProto(request.getStatus()));
            return MissionMapper.reply(mission, "Statut mis a jour");
        });
    }

    @Override
    public void watchMissions(WatchMissionsRequest request, StreamObserver<MissionEvent> responseObserver) {
        Set<MissionEventType> types = request.getTypesList().isEmpty()
            ? Set.of() : EnumSet.copyOf(request.getTypesList());
        broadcaster.subscribe(responseObserver, types);
    }

    /** Client streaming : un objet par appel, qui accumule les positions jusqu'a la fin du flux. */
    @Override
    public StreamObserver<PositionUpdate> trackMission(StreamObserver<TrackingSummary> responseObserver) {
        return new TrackingCall(trackingService, clock, responseObserver);
    }

    /** Bidirectionnel : une session par intervenant connecte. */
    @Override
    public StreamObserver<DispatchCommand> dispatch(StreamObserver<DispatchEvent> responseObserver) {
        return new DispatchSession(missionService, broadcaster, (ServerCallStreamObserver<DispatchEvent>) responseObserver);
    }

    /** Execute un RPC unaire et traduit les exceptions en statuts gRPC. */
    private static <T> void respond(StreamObserver<T> observer, Supplier<T> call) {
        try {
            observer.onNext(call.get());
            observer.onCompleted();
        } catch (RuntimeException e) {
            observer.onError(statusOf(e).asRuntimeException());
        }
    }

    /** Argument invalide -> INVALID_ARGUMENT, mission inconnue -> NOT_FOUND, etat incompatible -> FAILED_PRECONDITION. */
    static Status statusOf(RuntimeException e) {
        if (e instanceof IllegalArgumentException) {
            return Status.INVALID_ARGUMENT.withDescription(e.getMessage());
        }
        if (e instanceof MissionNotFoundException) {
            return Status.NOT_FOUND.withDescription(e.getMessage());
        }
        if (e instanceof MissionStateException) {
            return Status.FAILED_PRECONDITION.withDescription(e.getMessage());
        }
        log.error("Erreur inattendue dans RescueCoordination", e);
        return Status.INTERNAL.withDescription("Erreur interne");
    }

    static Long id(String value, String field) {
        try {
            long id = Long.parseLong(value.trim());
            if (id <= 0) {
                throw new NumberFormatException();
            }
            return id;
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(field + " doit etre un identifiant numerique positif");
        }
    }

    private static int severity(int value) {
        if (value < 1 || value > 5) {
            throw new IllegalArgumentException("severity doit etre entre 1 et 5");
        }
        return value;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
