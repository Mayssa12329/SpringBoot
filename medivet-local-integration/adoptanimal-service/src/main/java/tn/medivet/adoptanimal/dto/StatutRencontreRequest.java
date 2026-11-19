package tn.medivet.adoptanimal.dto;

import jakarta.validation.constraints.NotNull;
import tn.medivet.adoptanimal.entity.StatutRencontre;

public record StatutRencontreRequest(@NotNull StatutRencontre statut) {
}
