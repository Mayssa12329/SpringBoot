package tn.medivet.adoptanimal.client;

import java.util.List;

/** Réponse de PetPass : statut ELIGIBLE ou NOT_ELIGIBLE (+ motifs). INDISPONIBLE = repli local. */
public record EligibiliteResponse(String statut, List<String> motifs) {

    public EligibiliteResponse {
        motifs = motifs == null ? List.of() : List.copyOf(motifs);
    }

    public boolean eligible() {
        return "ELIGIBLE".equals(statut);
    }

    public boolean indisponible() {
        return "INDISPONIBLE".equals(statut);
    }

    public static EligibiliteResponse indisponible(String motif) {
        return new EligibiliteResponse("INDISPONIBLE", List.of(motif));
    }
}
