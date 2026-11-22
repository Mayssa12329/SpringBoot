package com.medivet.vetinterop.service;

import org.springframework.stereotype.Service;
import com.medivet.vetinterop.entity.PuceRegistre;
import com.medivet.vetinterop.repository.PuceRegistreRepository;
import com.medivet.vetinterop.soap.generated.Verdict;

/**
 * Règle RM10 : une puce inconnue n'est PAS une erreur SOAP, c'est un résultat métier (NOT_FOUND).
 */
@Service
public class RegistreService {

    public record Resultat(Verdict verdict, String message) {
    }

    private final PuceRegistreRepository repository;

    public RegistreService(PuceRegistreRepository repository) {
        this.repository = repository;
    }

    public Resultat verifier(String puce) {
        return repository.findById(puce)
                .map(this::depuis)
                .orElseGet(() -> new Resultat(Verdict.NOT_FOUND, "Puce inconnue du registre"));
    }

    private Resultat depuis(PuceRegistre entree) {
        Verdict verdict = switch (entree.getStatut()) {
            case "VERIFIE" -> Verdict.VERIFIED;
            case "INCOHERENT" -> Verdict.INCONSISTENT;
            default -> Verdict.UNDETERMINED;
        };
        return new Resultat(verdict, entree.getMessage());
    }
}
