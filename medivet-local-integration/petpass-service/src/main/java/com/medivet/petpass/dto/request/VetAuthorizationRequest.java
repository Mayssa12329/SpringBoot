package com.medivet.petpass.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Schema(description = "Données pour accorder un accès vétérinaire au carnet PetPass")
public class VetAuthorizationRequest {

    @NotNull(message = "L'identifiant du vétérinaire (veterinarianId) est obligatoire")
    @Schema(example = "1")
    private Long veterinarianId;

    @Size(max = 150, message = "Le nom du vétérinaire ne peut pas dépasser 150 caractères")
    @Schema(example = "Dr. Martin Dupont")
    private String veterinarianName;

    @Schema(example = "2026-11-15")
    private LocalDate grantedDate;

    @Schema(example = "2027-05-15")
    private LocalDate expiryDate;

    @Size(max = 50, message = "Le statut ne peut pas dépasser 50 caractères")
    @Schema(example = "Actif")
    private String status = "Actif";

    // ── Getters & Setters ───────────────────────────────────────────────────

    public Long getVeterinarianId() { return veterinarianId; }
    public void setVeterinarianId(Long veterinarianId) { this.veterinarianId = veterinarianId; }

    public String getVeterinarianName() { return veterinarianName; }
    public void setVeterinarianName(String veterinarianName) { this.veterinarianName = veterinarianName; }

    public LocalDate getGrantedDate() { return grantedDate; }
    public void setGrantedDate(LocalDate grantedDate) { this.grantedDate = grantedDate; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
