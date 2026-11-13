package com.medivet.helpanimal.grpc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.concurrent.atomic.AtomicInteger;

import com.medivet.helpanimal.config.RescueProperties;
import com.medivet.helpanimal.exception.RescueServiceUnavailableException;
import com.medivet.rescue.grpc.AssignMissionRequest;
import com.medivet.rescue.grpc.AssignMissionResponse;
import com.medivet.rescue.grpc.RescueCoordinationGrpc;
import io.grpc.ManagedChannel;
import io.grpc.Server;
import io.grpc.inprocess.InProcessChannelBuilder;
import io.grpc.inprocess.InProcessServerBuilder;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

/** RM13 : timeout, reprises limitees, mode degrade. */
class RescueCoordinationClientTest {

    /** Timeout reduit a 100 ms pour que le test soit rapide ; 3 essais au total. */
    private static final RescueProperties.Grpc CONFIG = new RescueProperties.Grpc("localhost", 0, 100, 3, 10);

    private Server server;
    private ManagedChannel channel;

    @AfterEach
    void tearDown() {
        if (channel != null) {
            channel.shutdownNow();
        }
        if (server != null) {
            server.shutdownNow();
        }
    }

    private RescueCoordinationClient clientFor(RescueCoordinationGrpc.RescueCoordinationImplBase service) throws Exception {
        String name = InProcessServerBuilder.generateName();
        server = InProcessServerBuilder.forName(name).addService(service).build().start();
        channel = InProcessChannelBuilder.forName(name).build();
        return new RescueCoordinationClient(channel, CONFIG);
    }

    @Test
    void affectationReussie() throws Exception {
        RescueCoordinationClient client = clientFor(new RescueCoordinationStubService());

        AssignmentResult result = client.assignMission(7L, 42L, 48.85, 2.35, 4);

        assertThat(result.outcome()).isEqualTo(AssignmentResult.Outcome.ASSIGNED);
        assertThat(result.missionId()).isEqualTo("MIS-7");
    }

    @Test
    void stubAppliqueRm04() throws Exception {
        RescueCoordinationClient client = clientFor(new RescueCoordinationStubService());

        client.assignMission(8L, 42L, 48.85, 2.35, 4);
        AssignmentResult second = client.assignMission(8L, 43L, 48.85, 2.35, 4);

        assertThat(second.outcome()).isEqualTo(AssignmentResult.Outcome.ALREADY_ASSIGNED);
    }

    @Test
    void serviceTropLentTroisEssaisPuisIndisponible() throws Exception {
        AtomicInteger calls = new AtomicInteger();
        RescueCoordinationClient client = clientFor(new RescueCoordinationGrpc.RescueCoordinationImplBase() {
            @Override
            public void assignMission(AssignMissionRequest request, StreamObserver<AssignMissionResponse> observer) {
                calls.incrementAndGet();
                try {
                    Thread.sleep(500);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                observer.onNext(AssignMissionResponse.getDefaultInstance());
                observer.onCompleted();
            }
        });

        assertThatThrownBy(() -> client.assignMission(9L, 42L, 48.85, 2.35, 4))
            .isInstanceOf(RescueServiceUnavailableException.class);
        assertThat(calls.get()).isEqualTo(3);
    }

    @Test
    void serviceArreteIndisponible() {
        channel = InProcessChannelBuilder.forName("aucun-serveur").build();
        RescueCoordinationClient client = new RescueCoordinationClient(channel, CONFIG);

        assertThatThrownBy(() -> client.assignMission(10L, 42L, 48.85, 2.35, 4))
            .isInstanceOf(RescueServiceUnavailableException.class);
    }
}
