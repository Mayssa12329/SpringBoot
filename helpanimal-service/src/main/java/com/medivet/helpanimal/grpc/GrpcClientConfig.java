package com.medivet.helpanimal.grpc;

import com.medivet.helpanimal.config.RescueProperties;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Canal gRPC vers RescueCoordination : le stub local en S3, le vrai service en S5. */
@Configuration
public class GrpcClientConfig {

    @Bean(destroyMethod = "shutdownNow")
    public ManagedChannel rescueCoordinationChannel(RescueProperties properties,
                                                    ObjectProvider<RescueCoordinationStubServer> stubServer) {
        RescueCoordinationStubServer stub = stubServer.getIfAvailable();
        int port = stub != null ? stub.getPort() : properties.grpc().port();
        return ManagedChannelBuilder.forAddress(properties.grpc().host(), port)
            .usePlaintext()
            .build();
    }

    @Bean
    public RescueCoordinationClient rescueCoordinationClient(ManagedChannel rescueCoordinationChannel,
                                                             RescueProperties properties) {
        return new RescueCoordinationClient(rescueCoordinationChannel, properties.grpc());
    }
}
