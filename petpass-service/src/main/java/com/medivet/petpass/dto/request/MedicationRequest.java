package com.medivet.petpass.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Schema(description = "Données pour la prescription d'un traitement médicamenteux")
public class MedicationRequest {

    @NotBlank(message = "Le nom du médicament est obligatoire")
    @Size(max = 150, message = "Le nom du médicament ne peut pas dépasser 150 caractères")
    @Schema(example = "Amoxicilline 250mg")
    private String medicationName;

    @Size(max = 200, message = "Le dosage ne peut pas dépasser 200 caractères")
    @Schema(example = "1 comprimé matin et soir pendant 7 jours")
    private String dosage;

    @Schema(example = "2026-11-15")
    private LocalDate startDate;

    @Schema(example = "2026-11-22")
    private LocalDate nextDoseDate;

    @Size(max = 50, message = "Le statut ne peut pas dépasser 50 caractères")
    @Schema(example = "En cours")
    private String status = "En cours";

    @Size(max = 150, message = "Le nom du vétérinaire ne peut pas dépasser 150 caractères")
    @Schema(example = "Dr. Martin Dupont")
    private String veterinarianName;

    // ── Getters & Setters ───────────────────────────────────────────────────

    public String getMedicationName() { return medicationName; }
    public void setMedicationName(String medicationName) { this.medicationName = medicationName; }

    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getNextDoseDate() { return nextDoseDate; }
    public void setNextDoseDate(LocalDate nextDoseDate) { this.nextDoseDate = nextDoseDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getVeterinarianName() { return veterinarianName; }
    public void setVeterinarianName(String veterinarianName) { this.veterinarianName = veterinarianName; }
}
