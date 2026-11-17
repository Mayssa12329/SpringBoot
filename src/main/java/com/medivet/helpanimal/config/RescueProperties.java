package com.medivet.helpanimal.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Parametres de l'appel gRPC vers RescueCoordinationService (prefixe "rescue"). */
@ConfigurationProperties(prefix = "rescue")
public record RescueProperties(Grpc grpc, Stub stub) {

    /**
     * @param timeoutMs   deadline de chaque appel (RM13 : 3 s)
     * @param maxAttempts nombre total d'essais (RM13 : 1 appel + 2 reprises = 3)
     * @param retryWaitMs attente entre deux essais
     */
    public record Grpc(String host, int port, long timeoutMs, int maxAttempts, long retryWaitMs) { }

    /** Stub local du service d'affectation (sprint S3). */
    public record Stub(boolean enabled, int port) { }
}
