package com.medivet.rescue.grpc;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Predicate;

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

/** Client streaming (TrackMission) et bidirectionnel (Dispatch), sur un vrai serveur Netty. */
@SpringBootTest
@ActiveProfiles("test")
class StreamingRpcTest {

    private static final AtomicLong REPORT = new AtomicLong(8000);

    /** Position de l'animal dans toutes les missions de ce test (Tunis). */
    private static final double LAT = 36.8000;
    private static final double LNG = 10.1800;

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

    private String publish() {
        String reportId = String.valueOf(REPORT.incrementAndGet());
        blocking.publishMission(PublishMissionRequest.newBuilder().setReportId(reportId)
            .setLatitude(LAT).setLongitude(LNG).setSeverity(4).setSpecies("chien").build());
        return reportId;
    }

    private void assign(String reportId, String intervenantId) {
        blocking.assignMission(AssignMissionRequest.newBuilder().setReportId(reportId).setIntervenantId(intervenantId)
            .setLatitude(LAT).setLongitude(LNG).setSeverity(4).build());
    }

    // ================================================================ client streaming

    /** Reponse unique d'un appel client streaming. */
    private static final class SummaryObserver implements StreamObserver<TrackingSummary> {
        final CompletableFuture<TrackingSummary> result = new CompletableFuture<>();

        @Override
        public void onNext(TrackingSummary value) {
            result.complete(value);
        }

        @Override
        public void onError(Throwable t) {
            result.completeExceptionally(t);
        }

        @Override
        public void onCompleted() {
        }

        Status.Code errorCode() throws Exception {
            try {
                result.get(5, TimeUnit.SECONDS);
                return Status.Code.OK;
            } catch (java.util.concurrent.ExecutionException e) {
                return ((StatusRuntimeException) e.getCause()).getStatus().getCode();
            }
        }
    }

    private static PositionUpdate position(String reportId, String intervenantId, double lat, double lng, String at) {
        return PositionUpdate.newBuilder().setReportId(reportId).setIntervenantId(intervenantId)
            .setLatitude(lat).setLongitude(lng).setRecordedAt(at).build();
    }

    @Test
    void trackMission_bilanDuTrajetEnvoyeUneSeuleFoisALaFin() throws Exception {
        String reportId = publish();
        assign(reportId, "20");

        SummaryObserver response = new SummaryObserver();
        StreamObserver<PositionUpdate> positions = async.trackMission(response);
        // ~2,2 km plein nord vers l'animal, en 4 positions sur 6 minutes
        positions.onNext(position(reportId, "20", 36.7800, LNG, "2026-11-22T10:00:00Z"));
        positions.onNext(position(reportId, "20", 36.7867, LNG, "2026-11-22T10:02:00Z"));
        positions.onNext(position(reportId, "20", 36.7934, LNG, "2026-11-22T10:04:00Z"));
        assertThat(response.result).as("aucune reponse avant la fin du flux").isNotDone();
        positions.onNext(position(reportId, "20", 36.7995, LNG, "2026-11-22T10:06:00Z"));
        positions.onCompleted();

        TrackingSummary summary = response.result.get(5, TimeUnit.SECONDS);
        assertThat(summary.getMissionId()).isEqualTo("MIS-" + reportId);
        assertThat(summary.getPoints()).isEqualTo(4);
        assertThat(summary.getDistanceKm()).isBetween(2.1, 2.3);
        assertThat(summary.getDurationSeconds()).isEqualTo(360);
        assertThat(summary.getRemainingKm()).isLessThan(0.1);
        assertThat(summary.getArrived()).isTrue();
    }

    @Test
    void trackMission_refuseSiLIntervenantNEstPasAttribue() throws Exception {
        String reportId = publish();
        assign(reportId, "20");

        SummaryObserver response = new SummaryObserver();
        StreamObserver<PositionUpdate> positions = async.trackMission(response);
        positions.onNext(position(reportId, "21", 36.78, LNG, ""));
        // Refus des la premiere position, sans attendre la fin du flux
        assertThat(response.errorCode()).isEqualTo(Status.Code.FAILED_PRECONDITION);
    }

    @Test
    void trackMission_positionsInvalidesOuFluxVide() throws Exception {
        String reportId = publish();
        assign(reportId, "20");

        SummaryObserver outOfRange = new SummaryObserver();
        StreamObserver<PositionUpdate> first = async.trackMission(outOfRange);
        first.onNext(position(reportId, "20", 120.0, LNG, ""));
        assertThat(outOfRange.errorCode()).isEqualTo(Status.Code.INVALID_ARGUMENT);

        SummaryObserver empty = new SummaryObserver();
        async.trackMission(empty).onCompleted();
        assertThat(empty.errorCode()).isEqualTo(Status.Code.INVALID_ARGUMENT);
    }

    // ================================================================ bidirectionnel

    /** Un intervenant sur son canal de dispatch : envoie des commandes, recoit les evenements. */
    private final class Intervenant implements StreamObserver<DispatchEvent> {
        final List<DispatchEvent> received = new ArrayList<>();
        final StreamObserver<DispatchCommand> commands;

        Intervenant(String id) throws Exception {
            int before = broadcaster.listenerCount();
            commands = async.dispatch(this);
            send(DispatchCommand.Action.CONNECT, id, "");
            expect(e -> e.getKind() == DispatchEvent.Kind.CONFIRMED && e.getAction() == DispatchCommand.Action.CONNECT);
            assertThat(broadcaster.listenerCount()).isGreaterThan(before);
        }

        void send(DispatchCommand.Action action, String intervenantId, String reportId) {
            commands.onNext(DispatchCommand.newBuilder().setAction(action).setIntervenantId(intervenantId)
                .setReportId(reportId).build());
        }

        void command(DispatchCommand.Action action, String reportId) {
            send(action, "", reportId);
        }

        /** Premier evenement recu qui verifie la condition ; il est consomme, les autres restent disponibles. */
        DispatchEvent expect(Predicate<DispatchEvent> condition) throws InterruptedException {
            long deadline = System.currentTimeMillis() + 5000;
            while (System.currentTimeMillis() < deadline) {
                synchronized (received) {
                    for (Iterator<DispatchEvent> it = received.iterator(); it.hasNext(); ) {
                        DispatchEvent event = it.next();
                        if (condition.test(event)) {
                            it.remove();
                            return event;
                        }
                    }
                }
                Thread.sleep(20);
            }
            throw new AssertionError("Evenement attendu non recu dans les 5 s");
        }

        DispatchEvent answer(DispatchCommand.Action action, String reportId) throws InterruptedException {
            return expect(e -> (e.getKind() == DispatchEvent.Kind.CONFIRMED || e.getKind() == DispatchEvent.Kind.REFUSED)
                && e.getAction() == action && e.getReportId().equals(reportId));
        }

        DispatchEvent event(DispatchEvent.Kind kind, String reportId) throws InterruptedException {
            return expect(e -> e.getKind() == kind && e.getReportId().equals(reportId));
        }

        @Override
        public void onNext(DispatchEvent event) {
            synchronized (received) {
                received.add(event);
            }
        }

        @Override
        public void onError(Throwable t) {
        }

        @Override
        public void onCompleted() {
        }
    }

    @Test
    void dispatch_offreAcceptationConcurrenteDesistementEtDemarrage() throws Exception {
        String waiting = publish();               // deja ouverte avant la connexion
        Intervenant vet20 = new Intervenant("20");
        Intervenant vet21 = new Intervenant("21");

        // Les missions deja ouvertes sont proposees a la connexion
        assertThat(vet20.event(DispatchEvent.Kind.OFFER, waiting).getSpecies()).isEqualTo("chien");

        // Une nouvelle mission est poussee en direct aux deux intervenants
        String live = publish();
        vet20.event(DispatchEvent.Kind.OFFER, live);
        vet21.event(DispatchEvent.Kind.OFFER, live);

        // RM04 : 20 accepte le premier, 21 est refuse et voit la mission retiree
        vet20.command(DispatchCommand.Action.ACCEPT, live);
        DispatchEvent won = vet20.answer(DispatchCommand.Action.ACCEPT, live);
        assertThat(won.getKind()).isEqualTo(DispatchEvent.Kind.CONFIRMED);
        assertThat(won.getStatus()).isEqualTo(MissionStatus.MISSION_ASSIGNED);
        vet21.event(DispatchEvent.Kind.WITHDRAWN, live);
        vet21.command(DispatchCommand.Action.ACCEPT, live);
        assertThat(vet21.answer(DispatchCommand.Action.ACCEPT, live).getKind()).isEqualTo(DispatchEvent.Kind.REFUSED);

        // US46 : 20 se desiste, la mission est reproposee (RM05), 21 la prend et demarre
        vet20.command(DispatchCommand.Action.DECLINE, live);
        assertThat(vet20.answer(DispatchCommand.Action.DECLINE, live).getStatus()).isEqualTo(MissionStatus.MISSION_OPEN);
        assertThat(vet21.event(DispatchEvent.Kind.OFFER, live).getMessage()).contains("reattribution 1/3");
        vet21.command(DispatchCommand.Action.ACCEPT, live);
        assertThat(vet21.answer(DispatchCommand.Action.ACCEPT, live).getKind()).isEqualTo(DispatchEvent.Kind.CONFIRMED);
        vet21.command(DispatchCommand.Action.START, live);
        assertThat(vet21.answer(DispatchCommand.Action.START, live).getStatus()).isEqualTo(MissionStatus.MISSION_IN_PROGRESS);

        vet20.commands.onCompleted();
        vet21.commands.onCompleted();
    }

    @Test
    void dispatch_refusSansFermerLeCanal() throws Exception {
        Intervenant vet = new Intervenant("31");
        String reportId = publish();
        // Demarrer une mission non attribuee : refus metier, le canal reste ouvert
        vet.command(DispatchCommand.Action.START, reportId);
        assertThat(vet.answer(DispatchCommand.Action.START, reportId).getKind()).isEqualTo(DispatchEvent.Kind.REFUSED);
        vet.command(DispatchCommand.Action.ACCEPT, "999999");
        DispatchEvent unknown = vet.answer(DispatchCommand.Action.ACCEPT, "999999");
        assertThat(unknown.getKind()).isEqualTo(DispatchEvent.Kind.REFUSED);
        assertThat(unknown.getMessage()).contains("999999");
        vet.command(DispatchCommand.Action.ACCEPT, reportId);
        assertThat(vet.answer(DispatchCommand.Action.ACCEPT, reportId).getKind()).isEqualTo(DispatchEvent.Kind.CONFIRMED);
        vet.commands.onCompleted();
    }

    @Test
    void dispatch_commandeAvantConnexionRefusee() throws Exception {
        BlockingQueue<DispatchEvent> received = new LinkedBlockingQueue<>();
        StreamObserver<DispatchCommand> commands = async.dispatch(new StreamObserver<>() {
            @Override
            public void onNext(DispatchEvent value) {
                received.add(value);
            }

            @Override
            public void onError(Throwable t) {
            }

            @Override
            public void onCompleted() {
            }
        });
        commands.onNext(DispatchCommand.newBuilder().setAction(DispatchCommand.Action.ACCEPT).setReportId("1").build());
        DispatchEvent refused = received.poll(5, TimeUnit.SECONDS);
        assertThat(refused).isNotNull();
        assertThat(refused.getKind()).isEqualTo(DispatchEvent.Kind.REFUSED);
        assertThat(refused.getMessage()).contains("CONNECT");
        commands.onCompleted();
    }
}
