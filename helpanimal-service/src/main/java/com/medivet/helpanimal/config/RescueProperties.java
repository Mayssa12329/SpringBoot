package com.medivet.helpanimal.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Lien gRPC vers RescueCoordinationService (prefixe "rescue"). */
@ConfigurationProperties(prefix = "rescue")
public record RescueProperties(Grpc grpc, Watch watch) {

    /**
     * @param timeoutMs   delai de chaque appel (RM13 : 3 s)
     * @param maxAttempts nombre total d'essais (RM13 : 1 appel + 2 reprises = 3)
     * @param retryWaitMs attente entre deux essais
     */
    public record Grpc(String host, int port, long timeoutMs, int maxAttempts, long retryWaitMs) { }

    /** Abonnement au flux des missions (reattribution RM05, suivi US47). */
    public record Watch(boolean enabled, long reconnectDelayMs) { }
}
