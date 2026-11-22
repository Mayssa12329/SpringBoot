package com.medivet.adoptanimal.dto;

import jakarta.validation.constraints.NotNull;
import com.medivet.adoptanimal.model.StatutRencontre;

public record StatutRencontreRequest(@NotNull StatutRencontre statut) {
}
