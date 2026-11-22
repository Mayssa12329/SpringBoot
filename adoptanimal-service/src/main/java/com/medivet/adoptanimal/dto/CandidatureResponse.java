package com.medivet.adoptanimal.dto;

import com.medivet.adoptanimal.model.Candidature;
import com.medivet.adoptanimal.model.StatutCandidature;

import java.time.LocalDateTime;

public record CandidatureResponse(
        Long id, Long annonceId, Long candidatId, StatutCandidature statut,
        String commentaire, LocalDateTime createdAt) {

    public static CandidatureResponse from(Candidature c) {
        return new CandidatureResponse(c.getId(), c.getAnnonceId(), c.getCandidatId(),
                c.getStatut(), c.getCommentaire(), c.getCreatedAt());
    }
}
