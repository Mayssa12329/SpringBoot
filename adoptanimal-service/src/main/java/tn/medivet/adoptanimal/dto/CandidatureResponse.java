package tn.medivet.adoptanimal.dto;

import tn.medivet.adoptanimal.entity.Candidature;
import tn.medivet.adoptanimal.entity.StatutCandidature;

import java.time.LocalDateTime;

public record CandidatureResponse(
        Long id, Long annonceId, Long candidatId, StatutCandidature statut,
        String commentaire, LocalDateTime createdAt) {

    public static CandidatureResponse from(Candidature c) {
        return new CandidatureResponse(c.getId(), c.getAnnonceId(), c.getCandidatId(),
                c.getStatut(), c.getCommentaire(), c.getCreatedAt());
    }
}
