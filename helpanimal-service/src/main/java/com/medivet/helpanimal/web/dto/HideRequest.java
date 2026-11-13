package com.medivet.helpanimal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** US25 : masquage motive d'un signalement abusif. */
public record HideRequest(
    @NotBlank(message = "Le motif est obligatoire") @Size(max = 1000) String reason) {
}
