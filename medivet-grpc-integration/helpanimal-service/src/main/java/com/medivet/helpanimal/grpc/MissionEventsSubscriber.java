package com.medivet.helpanimal.grpc;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import com.medivet.helpanimal.config.RescueProperties;
import com.medivet.helpanimal.service.MissionReassignmentService;
import com.medivet.helpanimal.service.MissionStreamSync;
import com.medivet.rescue.grpc.MissionEvent;
import com.medivet.rescue.grpc.MissionEventType;
import com.medivet.rescue.grpc.RescueCoordinationGrpc;
import com.medivet.rescue.grpc.WatchMissionsRequest;
import io.grpc.ManagedChannel;
import io.grpc.stub.ClientCallStreamObserver;
import io.grpc.stub.ClientResponseObserver;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Server streaming (US47) : HelpAnimal s'abonne au flux des missions de RescueCoordination.
 * Une reattribution (desistement, 15 min sans reponse) ou une escalade (RM05) remet le
 * signalement en Qualifie ; une acceptation ou un demarrage fait depuis le canal de dispatch
 * le fait passer en Attribue ou En cours. Si le flux se coupe, l'abonnement est relance automatiquement.
 */
@Component
public class MissionEventsSubscriber {

    private static final Logger log = LoggerFactory.getLogger(MissionEventsSubscriber.class);

    private final RescueCoordinationGrpc.RescueCoordinationStub stub;
    private final MissionReassignmentService reassignmentService;
    private final MissionStreamSync streamSync;
    private final RescueProperties.Watch watch;
    private final ScheduledExecutorService reconnect = Executors.newSingleThreadScheduledExecutor(runnable -> {
        Thread thread = new Thread(runnable, "rescue-watch");
        thread.setDaemon(true);
        return thread;
    });
    private volatile ClientCallStreamObserver<WatchMissionsRequest> current;
    private volatile boolean stopped;

    public MissionEventsSubscriber(ManagedChannel channel, MissionReassignmentService reassignmentService,
                                   MissionStreamSync streamSync, RescueProperties properties) {
        this.stub = RescueCoordinationGrpc.newStub(channel);
        this.reassignmentService = reassignmentService;
        this.streamSync = streamSync;
        this.watch = properties.watch();
    }

    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        if (watch.enabled()) {
            subscribe();
        }
    }

    private void subscribe() {
        if (stopped) {
            return;
        }
        WatchMissionsRequest request = WatchMissionsRequest.newBuilder()
            .addTypes(MissionEventType.EVENT_ASSIGNED)
            .addTypes(MissionEventType.EVENT_IN_PROGRESS)
            .addTypes(MissionEventType.EVENT_REASSIGNED)
            .addTypes(MissionEventType.EVENT_ESCALATED)
            .build();
        stub.watchMissions(request, new ClientResponseObserver<WatchMissionsRequest, MissionEvent>() {
            @Override
            public void beforeStart(ClientCallStreamObserver<WatchMissionsRequest> requestStream) {
                current = requestStream;
            }

            @Override
            public void onNext(MissionEvent event) {
                handle(event);
            }

            @Override
            public void onError(Throwable error) {
                if (!stopped) {
                    log.warn("Flux RescueCoordination interrompu ({}), nouvel abonnement dans {} ms",
                        error.getMessage(), watch.reconnectDelayMs());
                    reconnect.schedule(MissionEventsSubscriber.this::subscribe, watch.reconnectDelayMs(), TimeUnit.MILLISECONDS);
                }
            }

            @Override
            public void onCompleted() {
                onError(new IllegalStateException("flux termine par le serveur"));
            }
        });
        log.info("Abonnement au flux des missions de RescueCoordination");
    }

    private void handle(MissionEvent event) {
        try {
            long reportId = Long.parseLong(event.getReportId());
            switch (event.getType()) {
                // Acceptation ou demarrage depuis le canal de dispatch (gRPC bidirectionnel)
                case EVENT_ASSIGNED -> streamSync.assigned(reportId, Long.parseLong(event.getIntervenantId()),
                    event.getMissionId());
                case EVENT_IN_PROGRESS -> streamSync.started(reportId, Long.parseLong(event.getIntervenantId()));
                case EVENT_REASSIGNED, EVENT_ESCALATED -> reassignmentService.release(reportId,
                    event.getType() == MissionEventType.EVENT_ESCALATED, event.getMessage(), null);
                default -> {
                    // autres evenements : rien a faire cote HelpAnimal
                }
            }
        } catch (RuntimeException e) {
            log.warn("Evenement de mission {} non applique : {}", event.getMissionId(), e.getMessage());
        }
    }

    @PreDestroy
    public void stop() {
        stopped = true;
        reconnect.shutdownNow();
        ClientCallStreamObserver<WatchMissionsRequest> stream = current;
        if (stream != null) {
            stream.cancel("arret de HelpAnimal", null);
        }
    }
}
