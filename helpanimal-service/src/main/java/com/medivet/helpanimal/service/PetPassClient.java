package com.medivet.helpanimal.service;

import java.util.Map;

import com.medivet.helpanimal.domain.Report;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Appel REST vers PetPassService : ouverture d'un dossier de prise en charge
 * quand un sauvetage est termine (scenario SC3, US09 cote PetPass).
 * Desactive par defaut (petpass.enabled=false) tant que PetPass n'expose pas l'endpoint.
 * RM13 : timeout 3 s, et un echec ne bloque jamais le sauvetage (mode degrade : log).
 */
@Component
public class PetPassClient {

    private static final Logger log = LoggerFactory.getLogger(PetPassClient.class);

    private final boolean enabled;
    private final RestClient restClient;

    public PetPassClient(@Value("${petpass.enabled:false}") boolean enabled,
                         @Value("${petpass.base-url:http://localhost:8082}") String baseUrl,
                         RestClient.Builder builder) {
        this.enabled = enabled;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(3000);
        requestFactory.setReadTimeout(3000);
        this.restClient = builder.baseUrl(baseUrl).requestFactory(requestFactory).build();
    }

    public void openCareFile(Report report) {
        if (!enabled) {
            log.info("PetPass desactive : dossier de prise en charge non cree pour le signalement {}", report.getId());
            return;
        }
        try {
            restClient.post()
                .uri("/api/care-files")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                    "source", "HELPANIMAL",
                    "reportId", report.getId(),
                    "species", report.getSpecies(),
                    "description", report.getDescription(),
                    "intervenantId", report.getAssigneeId() == null ? 0L : report.getAssigneeId()))
                .retrieve()
                .toBodilessEntity();
            log.info("Dossier PetPass ouvert pour le signalement {}", report.getId());
        } catch (RestClientException e) {
            log.warn("PetPass indisponible, dossier a creer plus tard pour le signalement {} : {}",
                report.getId(), e.getMessage());
        }
    }
}
