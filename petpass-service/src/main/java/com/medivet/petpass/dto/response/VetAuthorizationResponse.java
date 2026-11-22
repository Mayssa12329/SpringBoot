package com.medivet.petpass.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Schema(description = "Données d'une autorisation vétérinaire renvoyées par l'API")
public class VetAuthorizationResponse {

    private Long id;
    private Long animalId;
    private Long veterinarianId;
    private String veterinarianName;
    private LocalDate grantedDate;
    private LocalDate expiryDate;
    private String status;
    private LocalDateTime createdAt;

    // ── Getters & Setters ───────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAnimalId() { return animalId; }
    public void setAnimalId(Long animalId) { this.animalId = animalId; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
