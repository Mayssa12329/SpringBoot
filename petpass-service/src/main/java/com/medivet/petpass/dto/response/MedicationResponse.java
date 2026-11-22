package com.medivet.petpass.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Schema(description = "Données d'un traitement médicamenteux renvoyées par l'API")
public class MedicationResponse {

    private Long id;
    private Long animalId;
    private String medicationName;
    private String dosage;
    private LocalDate startDate;
    private LocalDate nextDoseDate;
    private String status;
    private String veterinarianName;
    private LocalDateTime createdAt;

    // ── Getters & Setters ───────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAnimalId() { return animalId; }
    public void setAnimalId(Long animalId) { this.animalId = animalId; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
