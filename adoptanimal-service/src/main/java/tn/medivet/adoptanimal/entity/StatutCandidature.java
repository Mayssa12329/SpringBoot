package tn.medivet.adoptanimal.entity;

public enum StatutCandidature {
    SOUMISE, EN_EXAMEN, ACCEPTEE, REFUSEE;

    /** Transitions autorisées : Soumise -> En examen -> Acceptée / Refusée uniquement. */
    public boolean peutPasserA(StatutCandidature cible) {
        return switch (this) {
            case SOUMISE -> cible == EN_EXAMEN;
            case EN_EXAMEN -> cible == ACCEPTEE || cible == REFUSEE;
            case ACCEPTEE, REFUSEE -> false;
        };
    }

    public boolean estActive() {
        return this == SOUMISE || this == EN_EXAMEN;
    }
}
