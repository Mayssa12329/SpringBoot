package com.medivet.adoptanimal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.medivet.adoptanimal.model.StatutCandidature;

public record StatutCandidatureRequest(
        @NotNull StatutCandidature statut,
        @Size(max = 500) String commentaire) {
}
