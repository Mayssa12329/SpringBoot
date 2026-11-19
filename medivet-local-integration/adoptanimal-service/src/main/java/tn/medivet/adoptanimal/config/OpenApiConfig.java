package tn.medivet.adoptanimal.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String BEARER = "bearerAuth";

    @Bean
    public OpenAPI adoptAnimalOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("AdoptAnimalService")
                        .description("Annonces, candidatures, rencontres et adoption encadrée - MediVet Connect. "
                                + "Bouton Authorize : coller le JWT obtenu sur auth-service (POST /api/auth/connexion) ; "
                                + "il est transmis à PetPass pour vérifier l'éligibilité de l'animal.")
                        .version("v1"))
                .components(new Components().addSecuritySchemes(BEARER, new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER));
    }
}
