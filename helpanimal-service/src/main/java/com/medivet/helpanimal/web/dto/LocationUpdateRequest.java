package com.medivet.helpanimal.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/** US20 : correction manuelle de la position. */
public record LocationUpdateRequest(
    @NotNull @DecimalMin(value = "-90.0", message = "Latitude entre -90 et 90")
    @DecimalMax(value = "90.0", message = "Latitude entre -90 et 90")
    Double latitude,

    @NotNull @DecimalMin(value = "-180.0", message = "Longitude entre -180 et 180")
    @DecimalMax(value = "180.0", message = "Longitude entre -180 et 180")
    Double longitude) {
}
