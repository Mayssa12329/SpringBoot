package com.medivet.petpass.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Schema(description = "Données pour l'enregistrement d'une consultation ou acte médical")
public class MedicalRecordRequest {

    @Schema(example = "2026-11-15T14:30:00")
    private LocalDateTime consultationDate;

    @NotBlank(message = "Le diagnostic ou motif de consultation est obligatoire")
    @Size(max = 500, message = "Le diagnostic ne peut pas dépasser 500 caractères")
    @Schema(example = "Consultation de routine - Vaccin annuel")
    private String diagnosis;

    @Size(max = 1000, message = "Le traitement ne peut pas dépasser 1000 caractères")
    @Schema(example = "Administration vaccin antirabique, vermifuge prescrit")
    private String treatment;

    @Size(max = 150, message = "Le nom du vétérinaire ne peut pas dépasser 150 caractères")
    @Schema(example = "Dr. Martin Dupont")
    private String veterinarianName;

    @Size(max = 2000, message = "Les notes ne peuvent pas dépasser 2000 caractères")
    @Schema(example = "Animal calme, température normale 38.5°C")
    private String notes;

    @Schema(example = "2027-11-15")
    private LocalDate nextVisitDate;

    // ── Getters & Setters ───────────────────────────────────────────────────

    public LocalDateTime getConsultationDate() { return consultationDate; }
    public void setConsultationDate(LocalDateTime consultationDate) { this.consultationDate = consultationDate; }

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }

    public String getTreatment() { return treatment; }
    public void setTreatment(String treatment) { this.treatment = treatment; }

    public String getVeterinarianName() { return veterinarianName; }
    public void setVeterinarianName(String veterinarianName) { this.veterinarianName = veterinarianName; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDate getNextVisitDate() { return nextVisitDate; }
    public void setNextVisitDate(LocalDate nextVisitDate) { this.nextVisitDate = nextVisitDate; }
}
