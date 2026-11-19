package tn.medivet.adoptanimal.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import tn.medivet.adoptanimal.client.EligibiliteClient;
import tn.medivet.adoptanimal.client.EligibiliteResponse;
import tn.medivet.adoptanimal.client.IdentiteClient;
import tn.medivet.adoptanimal.client.IdentiteVerdict;
import tn.medivet.adoptanimal.dto.AnnonceRequest;
import tn.medivet.adoptanimal.entity.Annonce;
import tn.medivet.adoptanimal.entity.StatutAnnonce;
import tn.medivet.adoptanimal.exception.ConflitMetierException;
import tn.medivet.adoptanimal.exception.RegleMetierException;
import tn.medivet.adoptanimal.exception.RessourceIntrouvableException;
import tn.medivet.adoptanimal.repository.AnnonceRepository;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnonceService {

    private final AnnonceRepository annonceRepository;
    private final IdentiteClient identiteClient;
    private final EligibiliteClient eligibiliteClient;
    private final HistoriqueService historiqueService;

    /** Résultat des contrôles de publication : motifs de refus et/ou vérification impossible (panne). */
    private record Controle(List<String> motifs, boolean enAttente) {
    }

    /**
     * RM12 : publication si identité VERIFIED et animal ELIGIBLE, sinon 422 avec motifs.
     * RM13 : si un service externe est en panne, l'annonce est créée en VERIFICATION_EN_ATTENTE (rien n'est perdu).
     */
    public Annonce publier(AnnonceRequest req, Long acteurId) {
        Controle controle = controler(req.puce(), req.animalId());
        if (!controle.motifs().isEmpty()) {
            throw new RegleMetierException(controle.motifs());
        }

        Annonce annonce = new Annonce();
        annonce.setAnimalId(req.animalId());
        annonce.setPuce(req.puce());
        annonce.setNom(req.nom());
        annonce.setEspece(req.espece());
        annonce.setAgeEstime(req.ageEstime());
        annonce.setLocalisation(req.localisation());
        annonce.setDescription(req.description());
        annonce.setPhotoUrl(req.photoUrl());
        annonce.setRefugeId(req.refugeId());
        annonce.setStatut(controle.enAttente() ? StatutAnnonce.VERIFICATION_EN_ATTENTE : StatutAnnonce.ACTIVE);

        Annonce enregistree = annonceRepository.save(annonce);
        historiqueService.enregistrer("ANNONCE", enregistree.getId(), "PUBLICATION_" + enregistree.getStatut(),
                acteurId, null);
        return enregistree;
    }

    /** Relance la vérification d'une annonce restée en attente après une panne. */
    public Annonce reverifier(Long id, Long acteurId) {
        Annonce annonce = trouver(id);
        if (annonce.getStatut() != StatutAnnonce.VERIFICATION_EN_ATTENTE) {
            throw new ConflitMetierException("Seules les annonces en attente de vérification peuvent être revérifiées");
        }
        Controle controle = controler(annonce.getPuce(), annonce.getAnimalId());
        if (!controle.motifs().isEmpty()) {
            throw new RegleMetierException(controle.motifs());
        }
        if (!controle.enAttente()) {
            annonce.setStatut(StatutAnnonce.ACTIVE);
            annonce = annonceRepository.save(annonce);
            historiqueService.enregistrer("ANNONCE", id, "VERIFICATION_REUSSIE", acteurId, null);
        }
        return annonce;
    }

    /** Seules les annonces actives sont listées (US28). */
    public List<Annonce> rechercher(String espece, String localisation, Integer ageMax) {
        Specification<Annonce> spec = (root, query, cb) -> cb.equal(root.get("statut"), StatutAnnonce.ACTIVE);
        if (espece != null && !espece.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(cb.lower(root.get("espece")), espece.trim().toLowerCase()));
        }
        if (localisation != null && !localisation.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("localisation")), "%" + localisation.trim().toLowerCase() + "%"));
        }
        if (ageMax != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("ageEstime"), ageMax));
        }
        return annonceRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    public Annonce trouver(Long id) {
        return annonceRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Annonce " + id + " introuvable"));
    }

    private Controle controler(String puce, Long animalId) {
        List<String> motifs = new ArrayList<>();
        boolean enAttente = false;

        IdentiteVerdict verdict = identiteClient.verifier(puce);
        switch (verdict) {
            case VERIFIED -> { }
            case INDISPONIBLE -> enAttente = true;
            default -> motifs.add("Identité non vérifiée (verdict du registre : " + verdict + ")");
        }

        EligibiliteResponse eligibilite = eligibiliteClient.verifier(animalId);
        if (eligibilite.indisponible()) {
            enAttente = true;
        } else if (!eligibilite.eligible()) {
            motifs.addAll(eligibilite.motifs().isEmpty()
                    ? List.of("Animal non éligible médicalement")
                    : eligibilite.motifs());
        }
        return new Controle(motifs, enAttente);
    }
}
