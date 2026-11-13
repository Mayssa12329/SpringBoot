package com.medivet.controller;

import com.medivet.model.Medication;
import com.medivet.service.MedicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Medication management (US09 - Prescriptions & Active Medications)
 * Tracks active medications, dosages and renewal schedules per animal
 */
@RestController
@RequestMapping("/api/v1/animals/{animalId}/medications")
@CrossOrigin(origins = "*")
public class MedicationController {

    @Autowired
    private MedicationService medicationService;

    /**
     * GET /api/v1/animals/{animalId}/medications
     * Retrieve all active medications for a specific animal
     */
    @GetMapping
    public ResponseEntity<List<Medication>> getMedications(@PathVariable Long animalId) {
        return ResponseEntity.ok(medicationService.getMedicationsByAnimal(animalId));
    }

    /**
     * POST /api/v1/animals/{animalId}/medications
     * Add a new medication/prescription for an animal
     */
    @PostMapping
    public ResponseEntity<Medication> addMedication(
            @PathVariable Long animalId,
            @RequestBody Medication medication) {
        Medication created = medicationService.addMedication(animalId, medication);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/v1/animals/{animalId}/medications/{id}
     * Update an existing medication record
     */
    @PutMapping("/{id}")
    public ResponseEntity<Medication> updateMedication(
            @PathVariable Long animalId,
            @PathVariable Long id,
            @RequestBody Medication medication) {
        return medicationService.updateMedication(id, medication)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * DELETE /api/v1/animals/{animalId}/medications/{id}
     * Delete a medication record
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedication(
            @PathVariable Long animalId,
            @PathVariable Long id) {
        if (medicationService.deleteMedication(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}

