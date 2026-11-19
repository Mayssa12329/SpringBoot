package tn.medivet.adoptanimal.dto;

import tn.medivet.adoptanimal.entity.Rencontre;
import tn.medivet.adoptanimal.entity.StatutRencontre;

import java.time.LocalDateTime;

public record RencontreResponse(Long id, Long candidatureId, LocalDateTime dateRencontre, StatutRencontre statut) {

    public static RencontreResponse from(Rencontre r) {
        return new RencontreResponse(r.getId(), r.getCandidatureId(), r.getDateRencontre(), r.getStatut());
    }
}
