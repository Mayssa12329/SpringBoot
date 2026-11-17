package com.medivet.helpanimal.service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

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
 * Appel REST HelpAnimal -> PetPassService (backlog : "HelpAnimal -> PetPass (REST)", scenario SC3).
 * A la fin d'un sauvetage, l'animal secouru est enregistre dans PetPass avec un acte medical
 * qui decrit l'intervention. Le proprietaire provisoire est l'intervenant qui l'a pris en charge.
 * <p>
 * RM13 : delai de 3 s. Un echec ne bloque jamais le sauvetage (mode degrade : rien n'est lie,
 * le signalement garde petpassAnimalId vide). Pas de reprise automatique : la creation d'un
 * animal n'est pas idempotente, une reprise apres une reponse perdue creerait un doublon.
 */
@Component
public class PetPassClient {

    private static final Logger log = LoggerFactory.getLogger(PetPassClient.class);
    private static final int TIMEOUT_MS = 3000;

    private final boolean enabled;
    private final RestClient restClient;

    public PetPassClient(@Value("${petpass.enabled:true}") boolean enabled,
                         @Value("${petpass.base-url}") String baseUrl,
                         RestClient.Builder builder) {
        this.enabled = enabled;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(TIMEOUT_MS);
        requestFactory.setReadTimeout(TIMEOUT_MS);
        this.restClient = builder.baseUrl(baseUrl).requestFactory(requestFactory).build();
    }

    /** @return l'identifiant de l'animal cree dans PetPass, ou vide si PetPass est desactive ou en panne */
    public Optional<Long> registerRescuedAnimal(Report report) {
        if (!enabled) {
            log.info("PetPass desactive : animal du signalement {} non enregistre", report.getId());
            return Optional.empty();
        }
        try {
            CreatedAnimal animal = restClient.post()
                .uri("/api/v1/animals")
                .contentType(MediaType.APPLICATION_JSON)
                .body(animalOf(report))
                .retrieve()
                .body(CreatedAnimal.class);
            if (animal == null || animal.id() == null) {
                log.warn("PetPass n'a pas renvoye d'identifiant pour le signalement {}", report.getId());
                return Optional.empty();
            }
            restClient.post()
                .uri("/api/v1/animals/{animalId}/medical-records", animal.id())
                .contentType(MediaType.APPLICATION_JSON)
                .body(rescueRecordOf(report))
                .retrieve()
                .toBodilessEntity();
            log.info("Signalement {} enregistre dans PetPass (animal {})", report.getId(), animal.id());
            return Optional.of(animal.id());
        } catch (RestClientException e) {
            log.warn("PetPass indisponible pour le signalement {} : {}", report.getId(), e.getMessage());
            return Optional.empty();
        }
    }

    private static Map<String, Object> animalOf(Report report) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("ownerId", report.getAssigneeId());
        body.put("name", "Animal secouru #" + report.getId());
        body.put("species", report.getSpecies());
        body.put("description", truncate("Secouru via HelpAnimal (signalement #" + report.getId() + ") : "
            + report.getDescription(), 1000));
        body.put("healthStatus", "SECOURU");
        return body;
    }

    private static Map<String, Object> rescueRecordOf(Report report) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("consultationDate", LocalDateTime.now().withNano(0).toString());
        body.put("diagnosis", truncate("Sauvetage HelpAnimal - " + report.getCategory()
            + ", gravite " + report.getSeverity() + "/5", 500));
        body.put("notes", truncate(report.getDescription(), 2000));
        return body;
    }

    private static String truncate(String text, int max) {
        return text.length() <= max ? text : text.substring(0, max);
    }

    /** Seul champ utile de AnimalResponse (PetPass). */
    record CreatedAnimal(Long id) {
    }
}
