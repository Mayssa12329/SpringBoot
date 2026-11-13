package com.medivet.helpanimal.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/** Ajoute le bouton "Authorize" dans Swagger pour envoyer le jeton JWT. */
@Configuration
@OpenAPIDefinition(
    info = @Info(title = "HelpAnimalService API", version = "0.1.0",
        description = "E04 HelpAnimal : US19 a US25"),
    security = @SecurityRequirement(name = "bearerAuth"))
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
public class OpenApiConfig {
}
