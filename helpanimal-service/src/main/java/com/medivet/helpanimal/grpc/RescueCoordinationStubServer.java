package com.medivet.helpanimal.grpc;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import com.medivet.helpanimal.config.RescueProperties;
import io.grpc.Server;
import io.grpc.ServerBuilder;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Demarre un vrai serveur gRPC local (port 9090 par defaut) qui joue le role
 * de RescueCoordinationService pendant le sprint S3.
 * Desactiver avec rescue.stub.enabled=false quand le vrai service est livre (S5).
 */
@Component
@ConditionalOnProperty(prefix = "rescue.stub", name = "enabled", havingValue = "true")
public class RescueCoordinationStubServer {

    private static final Logger log = LoggerFactory.getLogger(RescueCoordinationStubServer.class);

    private final Server server;

    public RescueCoordinationStubServer(RescueProperties properties) {
        this.server = ServerBuilder.forPort(properties.stub().port())
            .addService(new RescueCoordinationStubService())
            .build();
    }

    @PostConstruct
    public void start() throws IOException {
        server.start();
        log.info("Stub gRPC RescueCoordination demarre sur le port {}", server.getPort());
    }

    @PreDestroy
    public void stop() throws InterruptedException {
        server.shutdown();
        if (!server.awaitTermination(2, TimeUnit.SECONDS)) {
            server.shutdownNow();
        }
    }

    /** Port reel (utile quand le port configure vaut 0 dans les tests). */
    public int getPort() {
        return server.getPort();
    }
}
