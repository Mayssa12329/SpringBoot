package com.medivet.rescue.grpc;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.concurrent.TimeUnit;

import com.medivet.rescue.config.RescueProperties;
import io.grpc.Server;
import io.grpc.ServerBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.SmartLifecycle;
import org.springframework.stereotype.Component;

/** Demarre et arrete le serveur gRPC avec l'application. */
@Component
public class GrpcServerRunner implements SmartLifecycle {

    private static final Logger log = LoggerFactory.getLogger(GrpcServerRunner.class);

    private final RescueCoordinationGrpcService service;
    private final int configuredPort;
    private Server server;

    public GrpcServerRunner(RescueCoordinationGrpcService service, RescueProperties properties) {
        this.service = service;
        this.configuredPort = properties.grpc().port();
    }

    @Override
    public void start() {
        try {
            server = ServerBuilder.forPort(configuredPort).addService(service).build().start();
            log.info("Serveur gRPC RescueCoordination demarre sur le port {}", server.getPort());
        } catch (IOException e) {
            throw new UncheckedIOException("Impossible de demarrer le serveur gRPC sur le port " + configuredPort, e);
        }
    }

    @Override
    public void stop() {
        if (server != null) {
            server.shutdown();
            try {
                if (!server.awaitTermination(5, TimeUnit.SECONDS)) {
                    server.shutdownNow();
                }
            } catch (InterruptedException e) {
                server.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }

    @Override
    public boolean isRunning() {
        return server != null && !server.isShutdown();
    }

    /** Port reel (utile quand le port configure vaut 0 dans les tests). */
    public int getPort() {
        return server.getPort();
    }
}
