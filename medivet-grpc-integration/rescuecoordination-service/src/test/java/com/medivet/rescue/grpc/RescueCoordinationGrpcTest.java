package com.medivet.rescue.grpc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/** Contrat gRPC de bout en bout : vrai serveur Netty, appels unaires et server streaming. */
@SpringBootTest
@ActiveProfiles("test")
class RescueCoordinationGrpcTest {

    private static final AtomicLong REPORT = new AtomicLong(5000);

    @Autowired
    private GrpcServerRunner server;

    @Autowired
    private MissionEventBroadcaster broadcaster;

    private ManagedChannel channel;
    private RescueCoordinationGrpc.RescueCoordinationBlockingStub blocking;
    private RescueCoordinationGrpc.RescueCoordinationStub async;

    @BeforeEach
    void connect() {
        channel = ManagedChannelBuilder.forAddress("localhost", server.getPort()).usePlaintext().build();
        blocking = RescueCoordinationGrpc.newBlockingStub(channel).withDeadlineAfter(5, TimeUnit.SECONDS);
        async = RescueCoordinationGrpc.newStub(channel);
    }

    @AfterEach
    void close() throws InterruptedException {
        channel.shutdownNow().awaitTermination(5, TimeUnit.SECONDS);
    }

    /** Abonne au flux qui range les evenements recus dans une file. */
    private BlockingQueue<MissionEvent> watch(MissionEventType... types) throws InterruptedException {
        BlockingQueue<MissionEvent> received = new LinkedBlockingQueue<>();
        int before = broadcaster.subscriberCount();
        async.watchMissions(WatchMissionsRequest.newBuilder().addAllTypes(List.of(types)).build(),
            new StreamObserver<>() {
                @Override
                public void onNext(MissionEvent event) {
                    received.add(event);
                }

                @Override
                public void onError(Throwable t) {
                }

                @Override
                public void onCompleted() {
                }
            });
        for (int i = 0; i < 50 && broadcaster.subscriberCount() <= before; i++) {
            Thread.sleep(20);
        }
        return received;
    }

    /** Evenements de ce signalement, dans l'ordre d'arrivee. */
    private static List<MissionEventType> typesFor(BlockingQueue<MissionEvent> queue, String reportId, int expected)
            throws InterruptedException {
        List<MissionEventType> types = new java.util.ArrayList<>();
        long deadline = System.currentTimeMillis() + 5000;
        while (types.size() < expected && System.currentTimeMillis() < deadline) {
            MissionEvent event = queue.poll(100, TimeUnit.MILLISECONDS);
            if (event != null && event.getReportId().equals(reportId)) {
                types.add(event.getType());
            }
        }
        return types;
    }

    @Test
    void sc2_lesIntervenantsRecoiventLaMissionEtHelpAnimalLeSuivi() throws Exception {
        // Intervenants : seulement les missions a prendre ; HelpAnimal : tout le suivi
        BlockingQueue<MissionEvent> intervenants = watch(MissionEventType.EVENT_PUBLISHED, MissionEventType.EVENT_REASSIGNED);
        BlockingQueue<MissionEvent> helpAnimal = watch();
        String reportId = String.valueOf(REPORT.incrementAndGet());

        MissionReply published = blocking.publishMission(PublishMissionRequest.newBuilder()
            .setReportId(reportId).setLatitude(36.8).setLongitude(10.18).setSeverity(5).setSpecies("chat").build());
        assertThat(published.getStatus()).isEqualTo(MissionStatus.MISSION_OPEN);

        AssignMissionResponse first = blocking.assignMission(assign(reportId, "20"));
        AssignMissionResponse second = blocking.assignMission(assign(reportId, "21"));
        assertThat(first.getResult()).isEqualTo(AssignMissionResponse.Result.ASSIGNED);
        assertThat(first.getMissionId()).isEqualTo("MIS-" + reportId);
        assertThat(second.getResult()).isEqualTo(AssignMissionResponse.Result.ALREADY_ASSIGNED);

        blocking.declineMission(DeclineMissionRequest.newBuilder()
            .setReportId(reportId).setIntervenantId("20").setReason("Panne de vehicule").build());
        blocking.assignMission(assign(reportId, "21"));
        blocking.updateMissionStatus(status(reportId, "21", MissionStatus.MISSION_IN_PROGRESS));
        MissionReply done = blocking.updateMissionStatus(status(reportId, "21", MissionStatus.MISSION_COMPLETED));
        assertThat(done.getStatus()).isEqualTo(MissionStatus.MISSION_COMPLETED);

        assertThat(typesFor(intervenants, reportId, 2))
            .containsExactly(MissionEventType.EVENT_PUBLISHED, MissionEventType.EVENT_REASSIGNED);
        assertThat(typesFor(helpAnimal, reportId, 7)).containsExactly(
            MissionEventType.EVENT_PUBLISHED, MissionEventType.EVENT_ASSIGNED, MissionEventType.EVENT_DECLINED,
            MissionEventType.EVENT_REASSIGNED, MissionEventType.EVENT_ASSIGNED, MissionEventType.EVENT_IN_PROGRESS,
            MissionEventType.EVENT_COMPLETED);
    }

    @Test
    void erreursTraduitesEnStatutsGrpc() {
        assertThatThrownBy(() -> blocking.assignMission(assign("abc", "20")))
            .isInstanceOfSatisfying(StatusRuntimeException.class,
                e -> assertThat(e.getStatus().getCode()).isEqualTo(Status.Code.INVALID_ARGUMENT));

        assertThatThrownBy(() -> blocking.declineMission(DeclineMissionRequest.newBuilder()
                .setReportId(String.valueOf(REPORT.incrementAndGet())).setIntervenantId("20").build()))
            .isInstanceOfSatisfying(StatusRuntimeException.class,
                e -> assertThat(e.getStatus().getCode()).isEqualTo(Status.Code.NOT_FOUND));

        String reportId = String.valueOf(REPORT.incrementAndGet());
        blocking.publishMission(PublishMissionRequest.newBuilder()
            .setReportId(reportId).setLatitude(36.8).setLongitude(10.18).setSeverity(2).build());
        assertThatThrownBy(() -> blocking.updateMissionStatus(status(reportId, "20", MissionStatus.MISSION_COMPLETED)))
            .isInstanceOfSatisfying(StatusRuntimeException.class,
                e -> assertThat(e.getStatus().getCode()).isEqualTo(Status.Code.FAILED_PRECONDITION));
    }

    private static AssignMissionRequest assign(String reportId, String intervenantId) {
        return AssignMissionRequest.newBuilder().setReportId(reportId).setIntervenantId(intervenantId)
            .setLatitude(36.8).setLongitude(10.18).setSeverity(5).build();
    }

    private static UpdateMissionStatusRequest status(String reportId, String intervenantId, MissionStatus status) {
        return UpdateMissionStatusRequest.newBuilder().setReportId(reportId).setIntervenantId(intervenantId)
            .setStatus(status).build();
    }
}
