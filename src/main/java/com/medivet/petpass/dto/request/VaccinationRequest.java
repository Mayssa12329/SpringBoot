package com.medivet.petpass.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Schema(description = "Données pour l'enregistrement d'une vaccination")
public class VaccinationRequest {

    @NotBlank(message = "Le nom du vaccin est obligatoire")
    @Size(max = 150, message = "Le nom du vaccin ne peut pas dépasser 150 caractères")
    @Schema(example = "CHPPI - Maladie de Carré, Hépatite, Parvovirose, Para-influenza")
    private String vaccineName;

    @Schema(example = "2026-11-15")
    private LocalDate dateAdministered;

    @Schema(example = "2027-11-15")
    private LocalDate nextDueDate;

    @Size(max = 50, message = "Le numéro de lot ne peut pas dépasser 50 caractères")
    @Schema(example = "LOT-2026-9874")
    private String batchNumber;

    @Size(max = 150, message = "Le nom du vétérinaire ne peut pas dépasser 150 caractères")
    @Schema(example = "Dr. Martin Dupont")
    private String veterinarianName;

    @Size(max = 50, message = "Le statut ne peut pas dépasser 50 caractères")
    @Schema(example = "À jour")
    private String status = "À jour";

    // ── Getters & Setters ───────────────────────────────────────────────────

    public String getVaccineName() { return vaccineName; }
    public void setVaccineName(String vaccineName) { this.vaccineName = vaccineName; }

    public LocalDate getDateAdministered() { return dateAdministered; }
    public void setDateAdministered(LocalDate dateAdministered) { this.dateAdministered = dateAdministered; }

    public LocalDate getNextDueDate() { return nextDueDate; }
    public void setNextDueDate(LocalDate nextDueDate) { this.nextDueDate = nextDueDate; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public String getVeterinarianName() { return veterinarianName; }
    public void setVeterinarianName(String veterinarianName) { this.veterinarianName = veterinarianName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
