package com.medivet.controller;

import com.medivet.model.MedicalRecord;
import com.medivet.service.MedicalRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Medical Records / Consultations (US09)
 * Complete medical dossier: consultations, diagnoses, and prescriptions
 */
@RestController
@RequestMapping("/api/v1/animals/{animalId}/medical-records")
@CrossOrigin(origins = "*")
public class MedicalRecordController {

    @Autowired
    private MedicalRecordService medicalRecordService;

    /**
     * GET /api/v1/animals/{animalId}/medical-records
     * Retrieve consultation history for a specific animal (US09)
     */
    @GetMapping
    public ResponseEntity<List<MedicalRecord>> getMedicalRecords(@PathVariable Long animalId) {
        return ResponseEntity.ok(medicalRecordService.getMedicalRecordsByAnimal(animalId));
    }

    /**
     * POST /api/v1/animals/{animalId}/medical-records
     * Add a new consultation/medical record (US09)
     */
    @PostMapping
    public ResponseEntity<MedicalRecord> addMedicalRecord(
            @PathVariable Long animalId,
            @RequestBody MedicalRecord record) {
        MedicalRecord created = medicalRecordService.addMedicalRecord(animalId, record);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * GET /api/v1/animals/{animalId}/medical-records/{id}
     * Get a specific medical record
     */
    @GetMapping("/{id}")
    public ResponseEntity<MedicalRecord> getMedicalRecord(
            @PathVariable Long animalId,
            @PathVariable Long id) {
        return medicalRecordService.getMedicalRecordById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * PUT /api/v1/animals/{animalId}/medical-records/{id}
     * Update an existing medical record
     */
    @PutMapping("/{id}")
    public ResponseEntity<MedicalRecord> updateMedicalRecord(
            @PathVariable Long animalId,
            @PathVariable Long id,
            @RequestBody MedicalRecord record) {
        return medicalRecordService.updateMedicalRecord(id, record)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * DELETE /api/v1/animals/{animalId}/medical-records/{id}
     * Delete a medical record
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedicalRecord(
            @PathVariable Long animalId,
            @PathVariable Long id) {
        if (medicalRecordService.deleteMedicalRecord(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}

