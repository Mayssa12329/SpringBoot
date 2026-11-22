package com.medivet.adoptanimal.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.medivet.adoptanimal.model.Candidature;
import com.medivet.adoptanimal.model.Rencontre;
import com.medivet.adoptanimal.model.StatutCandidature;
import com.medivet.adoptanimal.model.StatutRencontre;
import com.medivet.adoptanimal.exception.ConflitMetierException;
import com.medivet.adoptanimal.exception.RessourceIntrouvableException;
import com.medivet.adoptanimal.repository.CandidatureRepository;
import com.medivet.adoptanimal.repository.RencontreRepository;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RencontreService {

    private final CandidatureRepository candidatureRepository;
    private final RencontreRepository rencontreRepository;
    private final HistoriqueService historiqueService;

    /** US31 : une rencontre ne se planifie que pour une candidature en examen ou acceptée. */
    @Transactional
    public Rencontre planifier(Long candidatureId, LocalDateTime date, Long acteurId) {
        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new RessourceIntrouvableException("Candidature " + candidatureId + " introuvable"));
        if (candidature.getStatut() != StatutCandidature.EN_EXAMEN
                && candidature.getStatut() != StatutCandidature.ACCEPTEE) {
            throw new ConflitMetierException("La candidature doit être en examen ou acceptée pour planifier une rencontre");
        }
        Rencontre rencontre = new Rencontre();
        rencontre.setCandidatureId(candidatureId);
        rencontre.setDateRencontre(date);
        Rencontre enregistree = rencontreRepository.save(rencontre);
        historiqueService.enregistrer("RENCONTRE", enregistree.getId(), "PLANIFIEE", acteurId, null);
        return enregistree;
    }

    @Transactional
    public Rencontre changerStatut(Long id, StatutRencontre cible, Long acteurId) {
        Rencontre rencontre = rencontreRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Rencontre " + id + " introuvable"));
        StatutRencontre actuel = rencontre.getStatut();
        if (!actuel.peutPasserA(cible)) {
            throw new ConflitMetierException("Transition invalide : " + actuel + " -> " + cible);
        }
        rencontre.setStatut(cible);
        Rencontre enregistree = rencontreRepository.save(rencontre);
        historiqueService.enregistrer("RENCONTRE", id, actuel + "->" + cible, acteurId, null);
        return enregistree;
    }
}
