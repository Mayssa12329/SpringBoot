package tn.medivet.adoptanimal.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.List;

/**
 * Appel REST vers PetPass (timeout 3 s, 2 reprises avec backoff, circuit breaker).
 * Contrat réel de PetPass : GET /api/v1/animals/{id} (fiche animal). L'éligibilité est déduite ici
 * des champs vaccinationStatus et healthStatus (voir {@link RegleEligibilite}).
 * PetPass exige un JWT : l'en-tête Authorization de la requête entrante est transmis tel quel.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "petpass.stub", havingValue = "false", matchIfMissing = true)
public class PetPassRestClient implements EligibiliteClient {

    private final RestClient restClient;

    public PetPassRestClient(@Qualifier("petPassHttpClient") RestClient restClient) {
        this.restClient = restClient;
    }

    @Override
    @Retry(name = "petpass", fallbackMethod = "repli")
    @CircuitBreaker(name = "petpass")
    public EligibiliteResponse verifier(Long animalId) {
        try {
            PetPassAnimal animal = restClient.get()
                    .uri("/api/v1/animals/{id}", animalId)
                    .headers(h -> {
                        String jeton = AuthorizationCourante.valeur();
                        if (jeton != null) {
                            h.set(HttpHeaders.AUTHORIZATION, jeton);
                        }
                    })
                    .retrieve()
                    .body(PetPassAnimal.class);
            return animal != null ? RegleEligibilite.evaluer(animal)
                    : EligibiliteResponse.indisponible("Réponse vide de PetPass");
        } catch (HttpClientErrorException.NotFound e) {
            return new EligibiliteResponse("NOT_ELIGIBLE", List.of("Animal introuvable dans PetPass"));
        } catch (HttpClientErrorException.Unauthorized | HttpClientErrorException.Forbidden e) {
            // PetPass exige un JWT (auth-service) : sans jeton valide, on ne peut pas vérifier -> repli local.
            log.warn("PetPass refuse l'accès (jeton JWT absent ou invalide) pour l'animal {}", animalId);
            return EligibiliteResponse.indisponible("Jeton JWT absent ou invalide pour PetPass");
        }
    }

    /** Méthode de repli : PetPass injoignable, l'annonce passera en VERIFICATION_EN_ATTENTE. */
    public EligibiliteResponse repli(Long animalId, Throwable cause) {
        log.warn("PetPass indisponible pour l'animal {} : {}", animalId, cause.toString());
        return EligibiliteResponse.indisponible("PetPass indisponible");
    }
}
