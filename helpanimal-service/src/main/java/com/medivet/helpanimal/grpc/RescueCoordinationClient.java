package com.medivet.helpanimal.grpc;

import java.time.Duration;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

import com.medivet.helpanimal.config.RescueProperties;
import com.medivet.helpanimal.exception.RescueServiceUnavailableException;
import com.medivet.rescue.grpc.AssignMissionRequest;
import com.medivet.rescue.grpc.AssignMissionResponse;
import com.medivet.rescue.grpc.RescueCoordinationGrpc;
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
 * Client gRPC vers RescueCoordinationService (US23).
 * RM13 : timeout de 3 s par appel, 2 reprises, circuit breaker.
 * Si le service reste indisponible, on leve RescueServiceUnavailableException (503)
 * et le signalement reste Qualifie.
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
            .build();
        this.circuitBreaker = CircuitBreaker.of("rescueCoordination", circuitConfig);

        this.retry.getEventPublisher().onRetry(event ->
            log.warn("RescueCoordination : nouvel essai {} apres erreur {}",
                event.getNumberOfRetryAttempts(), event.getLastThrowable().toString()));
    }

    public AssignmentResult assignMission(long reportId, long intervenantId,
                                          double latitude, double longitude, int severity) {
        AssignMissionRequest request = AssignMissionRequest.newBuilder()
            .setReportId(String.valueOf(reportId))
            .setIntervenantId(String.valueOf(intervenantId))
            .setLatitude(latitude)
            .setLongitude(longitude)
            .setSeverity(severity)
            .build();

        Supplier<AssignMissionResponse> call = () ->
            stub.withDeadlineAfter(timeoutMs, TimeUnit.MILLISECONDS).assignMission(request);
        Supplier<AssignMissionResponse> protectedCall =
            Retry.decorateSupplier(retry, CircuitBreaker.decorateSupplier(circuitBreaker, call));

        try {
            return AssignmentResult.from(protectedCall.get());
        } catch (CallNotPermittedException e) {
            log.warn("RescueCoordination : circuit ouvert, appel non tente");
            throw new RescueServiceUnavailableException(
                "Service d'affectation indisponible (circuit ouvert). Reessayez plus tard.");
        } catch (StatusRuntimeException e) {
            log.warn("RescueCoordination : echec definitif ({})", e.getStatus());
            throw new RescueServiceUnavailableException(
                "Service d'affectation indisponible : " + e.getStatus().getCode() + ". Le signalement reste Qualifie.");
        }
    }

    public CircuitBreaker.State circuitState() {
        return circuitBreaker.getState();
    }

    /** Seules les erreurs passageres sont reessayees. */
    static boolean isTransient(Throwable throwable) {
        if (throwable instanceof StatusRuntimeException sre) {
            Status.Code code = sre.getStatus().getCode();
            return code == Status.Code.UNAVAILABLE || code == Status.Code.DEADLINE_EXCEEDED;
        }
        return false;
    }
}
