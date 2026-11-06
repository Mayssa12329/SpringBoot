package tn.medivet.adoptanimal.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.medivet.adoptanimal.entity.DecisionHistorique;
import tn.medivet.adoptanimal.repository.DecisionHistoriqueRepository;

/** Journal des décisions (RM12, RM15). */
@Service
@RequiredArgsConstructor
public class HistoriqueService {

    private final DecisionHistoriqueRepository repository;

    public void enregistrer(String entite, Long entiteId, String decision, Long acteurId, String motif) {
        DecisionHistorique d = new DecisionHistorique();
        d.setEntite(entite);
        d.setEntiteId(entiteId);
        d.setDecision(decision);
        d.setActeurId(acteurId);
        d.setMotif(motif);
        repository.save(d);
    }
}
