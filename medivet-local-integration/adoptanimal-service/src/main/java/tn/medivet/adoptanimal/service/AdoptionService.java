package tn.medivet.adoptanimal.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.medivet.adoptanimal.client.NotificationClient;
import tn.medivet.adoptanimal.entity.Adoption;
import tn.medivet.adoptanimal.entity.Annonce;
import tn.medivet.adoptanimal.entity.Candidature;
import tn.medivet.adoptanimal.entity.StatutAnnonce;
import tn.medivet.adoptanimal.entity.StatutCandidature;
import tn.medivet.adoptanimal.entity.StatutRencontre;
import tn.medivet.adoptanimal.exception.ConflitMetierException;
import tn.medivet.adoptanimal.exception.RegleMetierException;
import tn.medivet.adoptanimal.exception.RessourceIntrouvableException;
import tn.medivet.adoptanimal.repository.AdoptionRepository;
import tn.medivet.adoptanimal.repository.AnnonceRepository;
import tn.medivet.adoptanimal.repository.CandidatureRepository;
import tn.medivet.adoptanimal.repository.RencontreRepository;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdoptionService {

    private final AnnonceRepository annonceRepository;
    private final CandidatureRepository candidatureRepository;
    private final RencontreRepository rencontreRepository;
    private final AdoptionRepository adoptionRepository;
    private final HistoriqueService historiqueService;
    private final NotificationClient notificationClient;

    /**
     * US32 / RM12 : une seule adoption finalisée par animal.
     * Garanti à trois niveaux : contrôle métier, contrainte UNIQUE sur adoption.annonce_id,
     * verrou optimiste (@Version) sur l'annonce. Une finalisation concurrente perdante reçoit un 409.
     */
    @Transactional
    public Adoption finaliser(Long annonceId, Long candidatureId, Long acteurId) {
        Annonce annonce = annonceRepository.findById(annonceId)
                .orElseThrow(() -> new RessourceIntrouvableException("Annonce " + annonceId + " introuvable"));

        if (annonce.getStatut() == StatutAnnonce.CLOTUREE || adoptionRepository.existsByAnnonceId(annonceId)) {
            throw new ConflitMetierException("L'adoption de cet animal est déjà finalisée");
        }
        if (annonce.getStatut() != StatutAnnonce.ACTIVE) {
            throw new ConflitMetierException("L'annonce n'est pas active (statut : " + annonce.getStatut() + ")");
        }

        Candidature retenue = candidatureRepository.findById(candidatureId)
                .filter(c -> c.getAnnonceId().equals(annonceId))
                .orElseThrow(() -> new RessourceIntrouvableException(
                        "Candidature " + candidatureId + " introuvable pour l'annonce " + annonceId));

        List<String> motifs = new ArrayList<>();
        if (retenue.getStatut() != StatutCandidature.ACCEPTEE) {
            motifs.add("La candidature doit être acceptée avant la finalisation");
        }
        if (!rencontreRepository.existsByCandidatureIdAndStatut(candidatureId, StatutRencontre.EFFECTUEE)) {
            motifs.add("Une rencontre effectuée est requise avant la finalisation");
        }
        if (!motifs.isEmpty()) {
            throw new RegleMetierException(motifs);
        }

        Adoption adoption = new Adoption();
        adoption.setAnnonceId(annonceId);
        adoption.setCandidatureId(candidatureId);
        adoption = adoptionRepository.saveAndFlush(adoption);

        annonce.setStatut(StatutAnnonce.CLOTUREE);
        annonceRepository.saveAndFlush(annonce);
        historiqueService.enregistrer("ADOPTION", adoption.getId(), "FINALISEE", acteurId,
                "candidature " + candidatureId);
        notificationClient.notifier("ADOPTION_FINALISEE", adoption.getId(), retenue.getCandidatId(),
                "Félicitations, votre adoption est finalisée");

        // Toutes les autres candidatures sont refusées automatiquement
        for (Candidature autre : candidatureRepository.findByAnnonceIdAndIdNot(annonceId, candidatureId)) {
            if (autre.getStatut() != StatutCandidature.REFUSEE) {
                autre.setStatut(StatutCandidature.REFUSEE);
                autre.setCommentaire("Animal adopté par un autre candidat");
                candidatureRepository.save(autre);
                historiqueService.enregistrer("CANDIDATURE", autre.getId(), "REFUS_AUTOMATIQUE", acteurId,
                        "adoption finalisée");
                notificationClient.notifier("CANDIDATURE_REFUSEE", autre.getId(), autre.getCandidatId(),
                        "L'animal a été adopté par un autre candidat");
            }
        }
        return adoption;
    }
}
