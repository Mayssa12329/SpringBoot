package com.medivet.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "medications", schema = "petpass_schema")
public class Medication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "animal_id", nullable = false)
    private Long animalId;

    @Column(name = "medication_name", nullable = false, length = 150)
    private String medicationName;

    @Column(name = "dosage", length = 200)
    private String dosage;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "next_dose_date")
    private LocalDate nextDoseDate;

    @Column(name = "status", length = 50)
    private String status = "En cours";

    @Column(name = "veterinarian_name", length = 150)
    private String veterinarianName;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
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

