package com.medivet.adoptanimal.client;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;

/** Simulation de PetPass (profil "stub") : l'animal 999 n'est pas éligible, 888 simule une panne. */
@Component
@ConditionalOnProperty(name = "petpass.stub", havingValue = "true")
public class PetPassStubClient implements EligibiliteClient {

    @Override
    public EligibiliteResponse verifier(Long animalId) {
        if (animalId == 999L) {
            return new EligibiliteResponse("NOT_ELIGIBLE", List.of("Vaccination antirabique manquante"));
        }
        if (animalId == 888L) {
            return EligibiliteResponse.indisponible("PetPass simulé indisponible");
        }
        return new EligibiliteResponse("ELIGIBLE", List.of());
    }
}
