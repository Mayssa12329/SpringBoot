package com.medivet.rescue.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Parametres du service (prefixe "rescue"). */
@ConfigurationProperties(prefix = "rescue")
public record RescueProperties(Grpc grpc, Reassignment reassignment) {

    /** @param port port du serveur gRPC (0 = aleatoire, pour les tests) */
    public record Grpc(int port) { }

    /**
     * RM05.
     * @param timeoutMinutes   delai sans reponse avant reattribution (15 min)
     * @param maxReassignments reattributions autorisees avant escalade (3)
     * @param checkIntervalMs  frequence de verification
     */
    public record Reassignment(long timeoutMinutes, int maxReassignments, long checkIntervalMs) { }
}
