package com.medivet.adoptanimal.dto;

import com.medivet.adoptanimal.model.Rencontre;
import com.medivet.adoptanimal.model.StatutRencontre;

import java.time.LocalDateTime;

public record RencontreResponse(Long id, Long candidatureId, LocalDateTime dateRencontre, StatutRencontre statut) {

    public static RencontreResponse from(Rencontre r) {
        return new RencontreResponse(r.getId(), r.getCandidatureId(), r.getDateRencontre(), r.getStatut());
    }
}
