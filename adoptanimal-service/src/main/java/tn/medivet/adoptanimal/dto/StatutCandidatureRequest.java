package tn.medivet.adoptanimal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import tn.medivet.adoptanimal.entity.StatutCandidature;

public record StatutCandidatureRequest(
        @NotNull StatutCandidature statut,
        @Size(max = 500) String commentaire) {
}
