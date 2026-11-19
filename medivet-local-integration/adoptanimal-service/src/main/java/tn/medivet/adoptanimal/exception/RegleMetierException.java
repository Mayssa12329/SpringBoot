package tn.medivet.adoptanimal.exception;

import java.util.List;

/** Règle métier non respectée, avec la liste des motifs : HTTP 422. */
public class RegleMetierException extends RuntimeException {

    private final List<String> motifs;

    public RegleMetierException(List<String> motifs) {
        super("Règle métier non respectée");
        this.motifs = List.copyOf(motifs);
    }

    public List<String> getMotifs() {
        return motifs;
    }
}
