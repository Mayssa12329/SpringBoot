package tn.medivet.adoptanimal.entity;

public enum StatutRencontre {
    PLANIFIEE, EFFECTUEE, ANNULEE;

    public boolean peutPasserA(StatutRencontre cible) {
        return this == PLANIFIEE && (cible == EFFECTUEE || cible == ANNULEE);
    }
}
