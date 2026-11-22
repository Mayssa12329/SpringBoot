package com.medivet.adoptanimal.client;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Règle d'éligibilité médicale à l'adoption, appliquée à la fiche PetPass.
 * PetPass stocke des libellés libres (up_to_date, A_JOUR, "À jour", EXPIRED, healthy, BON...) :
 * on les normalise avant comparaison. Toute valeur inconnue rend l'animal non éligible (prudence).
 */
public final class RegleEligibilite {

    private static final Set<String> VACCINATION_OK = Set.of("uptodate", "ajour", "valide", "valid");
    private static final Set<String> SANTE_OK = Set.of("healthy", "bon", "excellent", "sain", "bonne", "good");

    private RegleEligibilite() {
    }

    public static EligibiliteResponse evaluer(PetPassAnimal animal) {
        List<String> motifs = new ArrayList<>();
        if (!VACCINATION_OK.contains(normaliser(animal.vaccinationStatus()))) {
            motifs.add("Vaccination non à jour dans PetPass (" + valeur(animal.vaccinationStatus()) + ")");
        }
        if (!SANTE_OK.contains(normaliser(animal.healthStatus()))) {
            motifs.add("État de santé non favorable dans PetPass (" + valeur(animal.healthStatus()) + ")");
        }
        return new EligibiliteResponse(motifs.isEmpty() ? "ELIGIBLE" : "NOT_ELIGIBLE", motifs);
    }

    /** minuscules, sans accents, sans espaces ni tirets/underscores : "À jour" -> "ajour", "up_to_date" -> "uptodate". */
    static String normaliser(String s) {
        if (s == null) {
            return "";
        }
        String sansAccents = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return sansAccents.toLowerCase().replaceAll("[\\s_\\-]", "");
    }

    private static String valeur(String s) {
        return s == null || s.isBlank() ? "non renseigné" : s;
    }
}
