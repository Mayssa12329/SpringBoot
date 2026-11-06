package tn.medivet.adoptanimal.service;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.medivet.adoptanimal.client.NotificationClient;
import tn.medivet.adoptanimal.dto.CandidatureRequest;
import tn.medivet.adoptanimal.entity.Annonce;
import tn.medivet.adoptanimal.entity.Candidature;
import tn.medivet.adoptanimal.entity.StatutAnnonce;
import tn.medivet.adoptanimal.entity.StatutCandidature;
import tn.medivet.adoptanimal.exception.ConflitMetierException;
import tn.medivet.adoptanimal.exception.RessourceIntrouvableException;
import tn.medivet.adoptanimal.repository.AnnonceRepository;
import tn.medivet.adoptanimal.repository.CandidatureRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CandidatureService {

    private static final List<StatutCandidature> STATUTS_ACTIFS =
            List.of(StatutCandidature.SOUMISE, StatutCandidature.EN_EXAMEN);

    private final AnnonceRepository annonceRepository;
    private final CandidatureRepository candidatureRepository;
    private final HistoriqueService historiqueService;
    private final NotificationClient notificationClient;

    /** US29 : une seule candidature active par candidat et par annonce ; refus si l'animal est déjà adopté. */
    @Transactional
    public Candidature soumettre(Long annonceId, CandidatureRequest req) {
        Annonce annonce = annonceRepository.findById(annonceId)
                .orElseThrow(() -> new RessourceIntrouvableException("Annonce " + annonceId + " introuvable"));
        if (annonce.getStatut() == StatutAnnonce.CLOTUREE) {
            throw new ConflitMetierException("Cet animal a déjà été adopté");
        }
        if (annonce.getStatut() != StatutAnnonce.ACTIVE) {
            throw new ConflitMetierException("Cette annonce n'accepte pas de candidatures (statut : "
                    + annonce.getStatut() + ")");
        }
        if (candidatureRepository.existsByAnnonceIdAndCandidatIdAndStatutIn(
                annonceId, req.candidatId(), STATUTS_ACTIFS)) {
            throw new ConflitMetierException("Une candidature active existe déjà pour ce candidat et cette annonce");
        }

        Candidature candidature = new Candidature();
        candidature.setAnnonceId(annonceId);
        candidature.setCandidatId(req.candidatId());
        candidature.setCommentaire(req.commentaire());
        try {
            candidature = candidatureRepository.saveAndFlush(candidature);
        } catch (DataIntegrityViolationException e) {
            // l'index unique partiel a rattrapé une soumission concurrente
            throw new ConflitMetierException("Une candidature active existe déjà pour ce candidat et cette annonce");
        }
        historiqueService.enregistrer("CANDIDATURE", candidature.getId(), "SOUMISE", req.candidatId(), null);
        return candidature;
    }

    public List<Candidature> lister(Long annonceId) {
        if (!annonceRepository.existsById(annonceId)) {
            throw new RessourceIntrouvableException("Annonce " + annonceId + " introuvable");
        }
        return candidatureRepository.findByAnnonceIdOrderByCreatedAtAsc(annonceId);
    }

    /** US30 : Soumise -> En examen -> Acceptée / Refusée uniquement, sinon 409. */
    @Transactional
    public Candidature changerStatut(Long id, StatutCandidature cible, String commentaire, Long acteurId) {
        Candidature candidature = candidatureRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Candidature " + id + " introuvable"));
        StatutCandidature actuel = candidature.getStatut();
        if (!actuel.peutPasserA(cible)) {
            throw new ConflitMetierException("Transition invalide : " + actuel + " -> " + cible);
        }
        candidature.setStatut(cible);
        if (commentaire != null) {
            candidature.setCommentaire(commentaire);
        }
        Candidature enregistree = candidatureRepository.save(candidature);
        historiqueService.enregistrer("CANDIDATURE", id, actuel + "->" + cible, acteurId, commentaire);
        if (cible == StatutCandidature.ACCEPTEE || cible == StatutCandidature.REFUSEE) {
            notificationClient.notifier("CANDIDATURE_" + cible, id, candidature.getCandidatId(),
                    "Votre candidature a été " + (cible == StatutCandidature.ACCEPTEE ? "acceptée" : "refusée"));
        }
        return enregistree;
    }
}
