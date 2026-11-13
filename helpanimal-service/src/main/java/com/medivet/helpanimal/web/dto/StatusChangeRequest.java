package com.medivet.helpanimal.web.dto;

import com.medivet.helpanimal.domain.ReportStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** US24 : demande de changement d'etat. */
public record StatusChangeRequest(
    @NotNull(message = "Le nouvel etat est obligatoire") ReportStatus status,
    @Size(max = 1000) String comment) {
}
