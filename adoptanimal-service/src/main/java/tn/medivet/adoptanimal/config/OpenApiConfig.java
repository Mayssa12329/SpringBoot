package tn.medivet.adoptanimal.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI adoptAnimalOpenApi() {
        return new OpenAPI().info(new Info()
                .title("AdoptAnimalService")
                .description("Annonces, candidatures, rencontres et adoption encadrée - MediVet Connect")
                .version("v1"));
    }
}
