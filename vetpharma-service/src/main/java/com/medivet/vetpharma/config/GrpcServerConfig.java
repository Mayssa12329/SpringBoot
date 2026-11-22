package com.medivet.vetpharma.config;

import org.springframework.context.annotation.Configuration;

/**
 * Configuration du serveur gRPC.
 *
 * <p>Le port et les options réseau sont définis dans {@code application.yml}
 * sous la clé {@code grpc.server.*}.  Cette classe est un point d'extension
 * pour ajouter des intercepteurs (authentification, logging, métriques)
 * si nécessaire.
 *
 * <pre>
 * grpc:
 *   server:
 *     port: 9091
 * </pre>
 */
@Configuration
public class GrpcServerConfig {
    // Aucun bean supplémentaire pour l'instant.
    // Les intercepteurs gRPC se déclarent ici avec @Bean GrpcGlobalServerInterceptor.
}
