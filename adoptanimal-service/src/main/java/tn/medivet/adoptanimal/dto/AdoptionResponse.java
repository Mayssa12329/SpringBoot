package tn.medivet.adoptanimal.dto;

import tn.medivet.adoptanimal.entity.Adoption;

import java.time.LocalDateTime;

public record AdoptionResponse(Long id, Long annonceId, Long candidatureId, LocalDateTime finaliseeLe) {

    public static AdoptionResponse from(Adoption a) {
        return new AdoptionResponse(a.getId(), a.getAnnonceId(), a.getCandidatureId(), a.getFinaliseeLe());
    }
}
