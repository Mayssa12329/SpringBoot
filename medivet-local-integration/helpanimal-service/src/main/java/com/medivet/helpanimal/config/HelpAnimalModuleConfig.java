package com.medivet.helpanimal.config;

import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration propre au module HelpAnimal.
 * Le schema "bearerAuth" ajoute le bouton Authorize de Swagger pour le jeton de UserService.
 */
@Configuration
@EnableConfigurationProperties({HelpAnimalProperties.class})
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
public class HelpAnimalModuleConfig {
}
