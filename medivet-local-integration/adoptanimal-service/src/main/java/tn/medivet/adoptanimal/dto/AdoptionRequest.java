package tn.medivet.adoptanimal.dto;

import jakarta.validation.constraints.NotNull;

public record AdoptionRequest(@NotNull Long candidatureId) {
}
