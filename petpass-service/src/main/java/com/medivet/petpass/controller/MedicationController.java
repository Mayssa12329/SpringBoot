package com.medivet.petpass.controller;

import com.medivet.petpass.dto.request.MedicationRequest;
import com.medivet.petpass.dto.response.MedicationResponse;
import com.medivet.petpass.service.MedicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller pour la gestion des prescriptions médicamenteuses (PetPass - US09).
 */
@RestController
@RequestMapping("/api/v1/animals/{animalId}/medications")
@CrossOrigin(origins = "*")
@Tag(name = "PetPass - Médicaments & Prescriptions", description = "Traitements en cours et posologies")
public class MedicationController {

    @Autowired
    private MedicationService medicationService;

    @GetMapping
    @Operation(summary = "Lister les médicaments prescrits pour un animal (US09)")
    public ResponseEntity<List<MedicationResponse>> getMedications(@PathVariable Long animalId) {
        return ResponseEntity.ok(medicationService.getMedicationsByAnimal(animalId));
    }

    @PostMapping
    @Operation(summary = "Prescrire un nouveau traitement médicamenteux (US09)")
    public ResponseEntity<MedicationResponse> addMedication(
            @PathVariable Long animalId,
            @Valid @RequestBody MedicationRequest request) {
        MedicationResponse created = medicationService.addMedication(animalId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter le détail d'un traitement")
    public ResponseEntity<MedicationResponse> getMedication(
            @PathVariable Long animalId,
            @PathVariable Long id) {
        return ResponseEntity.ok(medicationService.getMedication(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour la posologie ou l'état d'un traitement")
    public ResponseEntity<MedicationResponse> updateMedication(
            @PathVariable Long animalId,
            @PathVariable Long id,
            @Valid @RequestBody MedicationRequest request) {
        return ResponseEntity.ok(medicationService.updateMedication(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un traitement médicamenteux")
    public ResponseEntity<Void> deleteMedication(
            @PathVariable Long animalId,
            @PathVariable Long id) {
        medicationService.deleteMedication(id);
        return ResponseEntity.noContent().build();
    }
}
