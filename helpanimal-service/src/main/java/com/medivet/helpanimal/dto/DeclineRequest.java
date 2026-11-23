package com.medivet.helpanimal.dto;

import jakarta.validation.constraints.Size;

/** US46 : desistement d'un intervenant, avec un motif facultatif. */
public record DeclineRequest(@Size(max = 300) String reason) {
}
