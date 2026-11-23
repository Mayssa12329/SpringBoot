package com.medivet.helpanimal.support;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicBoolean;

import com.medivet.rescue.grpc.AssignMissionRequest;
import com.medivet.rescue.grpc.AssignMissionResponse;
import com.medivet.rescue.grpc.DeclineMissionRequest;
import com.medivet.rescue.grpc.MissionEvent;
import com.medivet.rescue.grpc.MissionEventType;
import com.medivet.rescue.grpc.MissionReply;
import com.medivet.rescue.grpc.MissionStatus;
import com.medivet.rescue.grpc.PublishMissionRequest;
import com.medivet.rescue.grpc.RescueCoordinationGrpc;
import com.medivet.rescue.grpc.UpdateMissionStatusRequest;
import com.medivet.rescue.grpc.WatchMissionsRequest;
import io.grpc.ManagedChannel;
import io.grpc.Server;
import io.grpc.Status;
import io.grpc.inprocess.InProcessChannelBuilder;
import io.grpc.inprocess.InProcessServerBuilder;
import io.grpc.stub.StreamObserver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

/**
 * Faux RescueCoordinationService pour les tests de HelpAnimal : serveur gRPC en memoire,
 * premiere acceptation gagnante (RM04), desistement, et flux d'evenements pilote par les tests.
 * Le vrai service est teste dans le module rescuecoordination-service.
 */
@Configuration
@Profile("test")
public class FakeRescueCoordination {

    /** Nom propre a chaque contexte Spring de test. */
    private final String name = "rescue-test-" + UUID.randomUUID();

    @Bean
    public FakeService fakeRescueService() {
        return new FakeService();
    }

    @Bean(destroyMethod = "shutdownNow")
    public Server fakeRescueServer(FakeService service) throws IOException {
        return InProcessServerBuilder.forName(name).directExecutor().addService(service).build().start();
    }

    @Bean(destroyMethod = "shutdownNow")
    @Primary
    public ManagedChannel fakeRescueChannel(Server fakeRescueServer) {
        return InProcessChannelBuilder.forName(name).directExecutor().build();
    }

    public static class FakeService extends RescueCoordinationGrpc.RescueCoordinationImplBase {

        private final Map<String, String> assignments = new ConcurrentHashMap<>();
        private final Set<String> published = ConcurrentHashMap.newKeySet();
        private final List<String> statusUpdates = new CopyOnWriteArrayList<>();
        private final List<StreamObserver<MissionEvent>> watchers = new CopyOnWriteArrayList<>();
        private final AtomicBoolean unavailable = new AtomicBoolean();
        private final AtomicBoolean escalateNextDecline = new AtomicBoolean();

        /** Simule une panne de RescueCoordination (RM13). */
        public void setUnavailable(boolean value) {
            unavailable.set(value);
        }

        public void escalateNextDecline() {
            escalateNextDecline.set(true);
        }

        public boolean isPublished(long reportId) {
            return published.contains(String.valueOf(reportId));
        }

        public List<String> statusUpdates() {
            return statusUpdates;
        }

        public int watcherCount() {
            return watchers.size();
        }

        /** Pousse un evenement a HelpAnimal, comme le ferait le streaming du vrai service. */
        public void emit(MissionEvent event) {
            watchers.forEach(watcher -> watcher.onNext(event));
        }

        @Override
        public void publishMission(PublishMissionRequest request, StreamObserver<MissionReply> observer) {
            if (fail(observer)) {
                return;
            }
            published.add(request.getReportId());
            reply(observer, MissionReply.newBuilder().setMissionId("MIS-" + request.getReportId())
                .setStatus(MissionStatus.MISSION_OPEN).build());
        }

        @Override
        public void assignMission(AssignMissionRequest request, StreamObserver<AssignMissionResponse> observer) {
            if (fail(observer)) {
                return;
            }
            String existing = assignments.putIfAbsent(request.getReportId(), request.getIntervenantId());
            boolean won = existing == null || existing.equals(request.getIntervenantId());
            if (existing == null) {
                // Comme le vrai service : l'affectation part aussi dans le flux
                emit(MissionEvent.newBuilder().setMissionId("MIS-" + request.getReportId())
                    .setReportId(request.getReportId()).setIntervenantId(request.getIntervenantId())
                    .setType(MissionEventType.EVENT_ASSIGNED).setStatus(MissionStatus.MISSION_ASSIGNED)
                    .setMessage("Mission acceptee par l'intervenant " + request.getIntervenantId()).build());
            }
            reply(observer, AssignMissionResponse.newBuilder()
                .setResult(won ? AssignMissionResponse.Result.ASSIGNED : AssignMissionResponse.Result.ALREADY_ASSIGNED)
                .setMissionId(won ? "MIS-" + request.getReportId() : "")
                .setMessage(won ? "Mission attribuee" : "Mission deja attribuee")
                .build());
        }

        @Override
        public void declineMission(DeclineMissionRequest request, StreamObserver<MissionReply> observer) {
            if (fail(observer)) {
                return;
            }
            if (!assignments.remove(request.getReportId(), request.getIntervenantId())) {
                observer.onError(Status.FAILED_PRECONDITION
                    .withDescription("Seul l'intervenant attribue peut se desister").asRuntimeException());
                return;
            }
            boolean escalated = escalateNextDecline.getAndSet(false);
            // Comme le vrai service : l'evenement part dans le flux en meme temps que la reponse
            emit(MissionEvent.newBuilder().setMissionId("MIS-" + request.getReportId())
                .setReportId(request.getReportId())
                .setType(escalated ? MissionEventType.EVENT_ESCALATED : MissionEventType.EVENT_REASSIGNED)
                .setStatus(escalated ? MissionStatus.MISSION_ESCALATED : MissionStatus.MISSION_OPEN)
                .setMessage("Mission rediffusee apres desistement").build());
            reply(observer, MissionReply.newBuilder().setMissionId("MIS-" + request.getReportId())
                .setStatus(escalated ? MissionStatus.MISSION_ESCALATED : MissionStatus.MISSION_OPEN)
                .setMessage(escalated ? "Mission en escalade vers l'administrateur" : "Mission rediffusee aux intervenants")
                .build());
        }

        @Override
        public void updateMissionStatus(UpdateMissionStatusRequest request, StreamObserver<MissionReply> observer) {
            if (fail(observer)) {
                return;
            }
            statusUpdates.add(request.getReportId() + ":" + request.getStatus());
            reply(observer, MissionReply.newBuilder().setMissionId("MIS-" + request.getReportId())
                .setStatus(request.getStatus()).build());
        }

        @Override
        public void watchMissions(WatchMissionsRequest request, StreamObserver<MissionEvent> observer) {
            watchers.add(observer);
        }

        private boolean fail(StreamObserver<?> observer) {
            if (unavailable.get()) {
                observer.onError(Status.UNAVAILABLE.withDescription("RescueCoordination arrete").asRuntimeException());
                return true;
            }
            return false;
        }

        private static <T> void reply(StreamObserver<T> observer, T value) {
            observer.onNext(value);
            observer.onCompleted();
        }
    }
}
