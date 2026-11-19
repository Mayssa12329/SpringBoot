package tn.medivet.adoptanimal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CandidatureRequest(
        @NotNull Long candidatId,
        @Size(max = 500) String commentaire) {
}
