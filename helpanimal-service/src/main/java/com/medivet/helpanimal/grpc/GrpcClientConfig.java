package com.medivet.helpanimal.grpc;

import com.medivet.helpanimal.config.RescueProperties;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Canal gRPC vers RescueCoordinationService.
 * gRPC fonctionne sur HTTP/2 ; usePlaintext() = HTTP/2 sans TLS (h2c), adapte au reseau Docker interne.
 */
@Configuration
public class GrpcClientConfig {

    @Bean(destroyMethod = "shutdownNow")
    public ManagedChannel rescueCoordinationChannel(RescueProperties properties) {
        ManagedChannel channel = ManagedChannelBuilder
            .forAddress(properties.grpc().host(), properties.grpc().port())
            .usePlaintext()
            .build();
        // Ouvre la connexion des le demarrage : le premier appel n'attend pas l'initialisation reseau
        channel.getState(true);
        return channel;
    }

    @Bean
    public RescueCoordinationClient rescueCoordinationClient(ManagedChannel rescueCoordinationChannel,
                                                             RescueProperties properties) {
        return new RescueCoordinationClient(rescueCoordinationChannel, properties.grpc());
    }
}
