package com.medivet.helpanimal.web.dto;

import com.medivet.helpanimal.domain.ReportCategory;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Champs texte du formulaire multipart de creation (US19 + US20).
 * La photo est envoyee dans la partie "photo".
 */
public class ReportCreateRequest {

    @NotBlank(message = "L'espece est obligatoire")
    @Size(max = 50)
    private String species;

    @NotNull(message = "La categorie est obligatoire")
    private ReportCategory category;

    @NotBlank(message = "La description est obligatoire")
    @Size(max = 2000)
    private String description;

    @NotNull(message = "La gravite est obligatoire")
    @Min(value = 1, message = "La gravite va de 1 a 5")
    @Max(value = 5, message = "La gravite va de 1 a 5")
    private Integer severity;

    @NotNull(message = "La latitude est obligatoire")
    @DecimalMin(value = "-90.0", message = "Latitude entre -90 et 90")
    @DecimalMax(value = "90.0", message = "Latitude entre -90 et 90")
    private Double latitude;

    @NotNull(message = "La longitude est obligatoire")
    @DecimalMin(value = "-180.0", message = "Longitude entre -180 et 180")
    @DecimalMax(value = "180.0", message = "Longitude entre -180 et 180")
    private Double longitude;

    public String getSpecies() {
        return species;
    }

    public void setSpecies(String species) {
        this.species = species;
    }

    public ReportCategory getCategory() {
        return category;
    }

    public void setCategory(ReportCategory category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getSeverity() {
        return severity;
    }

    public void setSeverity(Integer severity) {
        this.severity = severity;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
}
