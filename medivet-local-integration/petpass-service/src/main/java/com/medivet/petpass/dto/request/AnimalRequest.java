package com.medivet.petpass.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Schema(description = "Données pour la création ou mise à jour d'un profil animal")
public class AnimalRequest {

    @NotNull(message = "L'identifiant du propriétaire (ownerId) est obligatoire")
    @Schema(example = "7", description = "Identifiant de l'utilisateur propriétaire")
    private Long ownerId;

    @NotBlank(message = "Le nom de l'animal est obligatoire")
    @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères")
    @Schema(example = "Rex")
    private String name;

    @NotBlank(message = "L'espèce est obligatoire")
    @Size(max = 50, message = "L'espèce ne peut pas dépasser 50 caractères")
    @Schema(example = "CHIEN")
    private String species;

    @Size(max = 100, message = "La race ne peut pas dépasser 100 caractères")
    @Schema(example = "Berger Allemand")
    private String breed;

    @Schema(example = "2022-05-10")
    private LocalDate birthDate;

    @Size(max = 10, message = "Le genre ne peut pas dépasser 10 caractères")
    @Schema(example = "M")
    private String gender;

    @Positive(message = "Le poids doit être un nombre positif")
    @Schema(example = "28.5")
    private Double weight;

    @Size(max = 50, message = "Le numéro de puce ne peut pas dépasser 50 caractères")
    @Schema(example = "250269600123456")
    private String microchipId;

    @Size(max = 500, message = "L'URL de la photo ne peut pas dépasser 500 caractères")
    @Schema(example = "https://images.unsplash.com/rex.jpg")
    private String photoUrl;

    @Size(max = 1000, message = "La description ne peut pas dépasser 1000 caractères")
    @Schema(example = "Chien en bonne santé")
    private String description;

    @Schema(example = "true")
    private Boolean isSterilized = false;

    @Size(max = 50, message = "Le statut vaccinal ne peut pas dépasser 50 caractères")
    @Schema(example = "A_JOUR")
    private String vaccinationStatus = "A_JOUR";

    @Size(max = 50, message = "L'état de santé ne peut pas dépasser 50 caractères")
    @Schema(example = "BON")
    private String healthStatus = "BON";

    // ── Getters & Setters ───────────────────────────────────────────────────

    public Long getOwnerId() { return ownerId; }
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSpecies() { return species; }
    public void setSpecies(String species) { this.species = species; }

    public String getBreed() { return breed; }
    public void setBreed(String breed) { this.breed = breed; }

    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }

    public String getMicrochipId() { return microchipId; }
    public void setMicrochipId(String microchipId) { this.microchipId = microchipId; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getIsSterilized() { return isSterilized; }
    public void setIsSterilized(Boolean isSterilized) { this.isSterilized = isSterilized; }

    public String getVaccinationStatus() { return vaccinationStatus; }
    public void setVaccinationStatus(String vaccinationStatus) { this.vaccinationStatus = vaccinationStatus; }

    public String getHealthStatus() { return healthStatus; }
    public void setHealthStatus(String healthStatus) { this.healthStatus = healthStatus; }
}
