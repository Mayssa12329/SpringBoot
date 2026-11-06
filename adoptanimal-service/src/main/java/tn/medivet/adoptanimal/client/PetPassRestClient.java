package tn.medivet.adoptanimal.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.List;

/**
 * Appel REST vers PetPass (timeout 3 s, 2 reprises avec backoff, circuit breaker).
 * Contrat attendu (provisoire) : GET /api/v1/animals/{id}/eligibilite -> {"statut":"ELIGIBLE","motifs":[]}
 */
@Slf4j
@Component
@Profile("!stub")
public class PetPassRestClient implements EligibiliteClient {

    private final RestClient restClient;

    public PetPassRestClient(@Qualifier("petPassRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    @Override
    @Retry(name = "petpass", fallbackMethod = "repli")
    @CircuitBreaker(name = "petpass")
    public EligibiliteResponse verifier(Long animalId) {
        try {
            EligibiliteResponse reponse = restClient.get()
                    .uri("/api/v1/animals/{id}/eligibilite", animalId)
                    .retrieve()
                    .body(EligibiliteResponse.class);
            return reponse != null ? reponse : EligibiliteResponse.indisponible("Réponse vide de PetPass");
        } catch (HttpClientErrorException.NotFound e) {
            return new EligibiliteResponse("NOT_ELIGIBLE", List.of("Animal introuvable dans PetPass"));
        }
    }

    /** Méthode de repli : PetPass injoignable, l'annonce passera en VERIFICATION_EN_ATTENTE. */
    public EligibiliteResponse repli(Long animalId, Throwable cause) {
        log.warn("PetPass indisponible pour l'animal {} : {}", animalId, cause.toString());
        return EligibiliteResponse.indisponible("PetPass indisponible");
    }
}
