package com.medivet.helpanimal.grpc;

import java.time.Duration;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

import com.medivet.helpanimal.config.RescueProperties;
import com.medivet.helpanimal.exception.MissionRejectedException;
import com.medivet.helpanimal.exception.RescueServiceUnavailableException;
import com.medivet.helpanimal.model.Report;
import com.medivet.rescue.grpc.AssignMissionRequest;
import com.medivet.rescue.grpc.AssignMissionResponse;
import com.medivet.rescue.grpc.DeclineMissionRequest;
import com.medivet.rescue.grpc.MissionReply;
import com.medivet.rescue.grpc.MissionStatus;
import com.medivet.rescue.grpc.PublishMissionRequest;
import com.medivet.rescue.grpc.RescueCoordinationGrpc;
import com.medivet.rescue.grpc.UpdateMissionStatusRequest;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import io.grpc.ManagedChannel;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Client gRPC HelpAnimal -> RescueCoordinationService.
 * RM13 : delai de 3 s par appel, 2 reprises pour les operations idempotentes (diffusion, affectation,
 * statut), circuit breaker commun. Service indisponible -> 503 et le signalement garde son etat.
 * Le desistement n'est pas repris : un second envoi serait refuse par RescueCoordination.
 */
public class RescueCoordinationClient {

    private static final Logger log = LoggerFactory.getLogger(RescueCoordinationClient.class);

    private final RescueCoordinationGrpc.RescueCoordinationBlockingStub stub;
    private final long timeoutMs;
    private final Retry retry;
    private final CircuitBreaker circuitBreaker;

    public RescueCoordinationClient(ManagedChannel channel, RescueProperties.Grpc config) {
        this.stub = RescueCoordinationGrpc.newBlockingStub(channel);
        this.timeoutMs = config.timeoutMs();

        RetryConfig retryConfig = RetryConfig.custom()
            .maxAttempts(Math.max(1, config.maxAttempts()))
            .waitDuration(Duration.ofMillis(Math.max(1, config.retryWaitMs())))
            .retryOnException(RescueCoordinationClient::isTransient)
            .build();
        this.retry = Retry.of("rescueCoordination", retryConfig);

        CircuitBreakerConfig circuitConfig = CircuitBreakerConfig.custom()
            .slidingWindowSize(10)
            .minimumNumberOfCalls(5)
            .failureRateThreshold(50)
            .waitDurationInOpenState(Duration.ofSeconds(30))
            .recordException(RescueCoordinationClient::isTransient)
            .build();
        this.circuitBreaker = CircuitBreaker.of("rescueCoordination", circuitConfig);

        this.retry.getEventPublisher().onRetry(event ->
            log.warn("RescueCoordination : nouvel essai {} apres erreur {}",
                event.getNumberOfRetryAttempts(), event.getLastThrowable().toString()));
    }

    /** SC2 etape 2 : le signalement qualifie devient une mission diffusee aux intervenants. */
    public MissionReply publishMission(Report report) {
        PublishMissionRequest request = PublishMissionRequest.newBuilder()
            .setReportId(String.valueOf(report.getId()))
            .setLatitude(report.getLatitude())
            .setLongitude(report.getLongitude())
            .setSeverity(report.getSeverity())
            .setSpecies(report.getSpecies())
            .build();
        return call(() -> stub().publishMission(request), true);
    }

    /** US23 / RM04 : la premiere acceptation validee gagne. */
    public AssignmentResult assignMission(long reportId, long intervenantId,
                                          double latitude, double longitude, int severity) {
        AssignMissionRequest request = AssignMissionRequest.newBuilder()
            .setReportId(String.valueOf(reportId))
            .setIntervenantId(String.valueOf(intervenantId))
            .setLatitude(latitude)
            .setLongitude(longitude)
            .setSeverity(severity)
            .build();
        AssignMissionResponse response = call(() -> stub().assignMission(request), true);
        return AssignmentResult.from(response);
    }

    /** US46 / RM05 : desistement de l'intervenant attribue. */
    public MissionReply declineMission(long reportId, long intervenantId, String reason) {
        DeclineMissionRequest request = DeclineMissionRequest.newBuilder()
            .setReportId(String.valueOf(reportId))
            .setIntervenantId(String.valueOf(intervenantId))
            .setReason(reason == null ? "" : reason)
            .build();
        return call(() -> stub().declineMission(request), false);
    }

    /** US47 : debut ou fin de l'intervention. */
    public MissionReply updateMissionStatus(long reportId, Long intervenantId, MissionStatus status) {
        UpdateMissionStatusRequest.Builder request = UpdateMissionStatusRequest.newBuilder()
            .setReportId(String.valueOf(reportId))
            .setStatus(status);
        if (intervenantId != null) {
            request.setIntervenantId(String.valueOf(intervenantId));
        }
        return call(() -> stub().updateMissionStatus(request.build()), true);
    }

    public CircuitBreaker.State circuitState() {
        return circuitBreaker.getState();
    }

    private RescueCoordinationGrpc.RescueCoordinationBlockingStub stub() {
        return stub.withDeadlineAfter(timeoutMs, TimeUnit.MILLISECONDS);
    }

    private <T> T call(Supplier<T> grpcCall, boolean idempotent) {
        Supplier<T> protectedCall = CircuitBreaker.decorateSupplier(circuitBreaker, grpcCall);
        if (idempotent) {
            protectedCall = Retry.decorateSupplier(retry, protectedCall);
        }
        try {
            return protectedCall.get();
        } catch (CallNotPermittedException e) {
            log.warn("RescueCoordination : circuit ouvert, appel non tente");
            throw new RescueServiceUnavailableException(
                "Service de coordination des secours indisponible (circuit ouvert). Reessayez plus tard.");
        } catch (StatusRuntimeException e) {
            if (isTransient(e)) {
                log.warn("RescueCoordination : echec definitif ({})", e.getStatus());
                throw new RescueServiceUnavailableException(
                    "Service de coordination des secours indisponible : " + e.getStatus().getCode());
            }
            String description = e.getStatus().getDescription();
            throw new MissionRejectedException(description == null ? "Operation refusee par RescueCoordination" : description);
        }
    }

    /** Seules les erreurs passageres sont reessayees et comptees par le circuit breaker. */
    static boolean isTransient(Throwable throwable) {
        if (throwable instanceof StatusRuntimeException sre) {
            Status.Code code = sre.getStatus().getCode();
            return code == Status.Code.UNAVAILABLE || code == Status.Code.DEADLINE_EXCEEDED;
        }
        return false;
    }
}
