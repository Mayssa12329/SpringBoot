package tn.medivet.adoptanimal.client;

public interface EligibiliteClient {

    /** Interroge PetPass sur l'éligibilité médicale d'un animal. Ne lève pas d'exception en cas de panne. */
    EligibiliteResponse verifier(Long animalId);
}
