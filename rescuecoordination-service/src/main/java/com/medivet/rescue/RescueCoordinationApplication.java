package com.medivet.rescue;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * RescueCoordinationService (gRPC) : missions de sauvetage, affectation unique (RM04),
 * reattribution apres desistement ou sans reponse (RM05), diffusion en streaming.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class RescueCoordinationApplication {

    public static void main(String[] args) {
        SpringApplication.run(RescueCoordinationApplication.class, args);
    }
}
