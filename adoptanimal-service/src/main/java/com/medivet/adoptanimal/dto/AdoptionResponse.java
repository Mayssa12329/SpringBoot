package com.medivet.adoptanimal.dto;

import com.medivet.adoptanimal.model.Adoption;

import java.time.LocalDateTime;

public record AdoptionResponse(Long id, Long annonceId, Long candidatureId, LocalDateTime finaliseeLe) {

    public static AdoptionResponse from(Adoption a) {
        return new AdoptionResponse(a.getId(), a.getAnnonceId(), a.getCandidatureId(), a.getFinaliseeLe());
    }
}
