package tn.medivet.adoptanimal.client;

public interface IdentiteClient {

    /** Vérifie l'identité d'un animal par sa puce. Ne lève pas d'exception en cas de panne : renvoie INDISPONIBLE. */
    IdentiteVerdict verifier(String puce);
}
