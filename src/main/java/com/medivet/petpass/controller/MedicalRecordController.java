package com.medivet.petpass.controller;

import com.medivet.petpass.dto.request.MedicalRecordRequest;
import com.medivet.petpass.dto.response.MedicalRecordResponse;
import com.medivet.petpass.service.MedicalRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller pour le dossier médical et les consultations (PetPass - US09).
 */
@RestController
@RequestMapping("/api/v1/animals/{animalId}/medical-records")
@CrossOrigin(origins = "*")
@Tag(name = "PetPass - Dossier Médical", description = "Consultations, diagnostics et actes médicaux par animal")
public class MedicalRecordController {

    @Autowired
    private MedicalRecordService medicalRecordService;

    @GetMapping
    @Operation(summary = "Consulter l'historique médical d'un animal (US09)")
    public ResponseEntity<List<MedicalRecordResponse>> getMedicalRecords(@PathVariable Long animalId) {
        return ResponseEntity.ok(medicalRecordService.getMedicalRecordsByAnimal(animalId));
    }

    @PostMapping
    @Operation(summary = "Ajouter un acte médical / consultation (US09)")
    public ResponseEntity<MedicalRecordResponse> addMedicalRecord(
            @PathVariable Long animalId,
            @Valid @RequestBody MedicalRecordRequest request) {
        MedicalRecordResponse created = medicalRecordService.addMedicalRecord(animalId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir un acte médical spécifique par ID")
    public ResponseEntity<MedicalRecordResponse> getMedicalRecord(
            @PathVariable Long animalId,
            @PathVariable Long id) {
        return ResponseEntity.ok(medicalRecordService.getMedicalRecord(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un acte médical existant")
    public ResponseEntity<MedicalRecordResponse> updateMedicalRecord(
            @PathVariable Long animalId,
            @PathVariable Long id,
            @Valid @RequestBody MedicalRecordRequest request) {
        return ResponseEntity.ok(medicalRecordService.updateMedicalRecord(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un acte médical")
    public ResponseEntity<Void> deleteMedicalRecord(
            @PathVariable Long animalId,
            @PathVariable Long id) {
        medicalRecordService.deleteMedicalRecord(id);
        return ResponseEntity.noContent().build();
    }
}
