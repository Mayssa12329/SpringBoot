package com.medivet.helpanimal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * HelpAnimalService (E04) : signalement d'animaux en detresse avec photo et GPS,
 * carte, signalements proches, acceptation de mission (gRPC), suivi et moderation.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class HelpAnimalApplication {

    public static void main(String[] args) {
        SpringApplication.run(HelpAnimalApplication.class, args);
    }
}
