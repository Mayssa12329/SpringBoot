package com.medivet.petpass.controller;

import com.medivet.petpass.dto.request.VaccinationRequest;
import com.medivet.petpass.dto.response.VaccinationResponse;
import com.medivet.petpass.service.VaccinationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller pour la gestion des vaccins (PetPass - US10).
 */
@RestController
@RequestMapping("/api/v1/animals/{animalId}/vaccinations")
@CrossOrigin(origins = "*")
@Tag(name = "PetPass - Vaccinations", description = "Carnet vaccinal et rappels de vaccins")
public class VaccinationController {

    @Autowired
    private VaccinationService vaccinationService;

    @GetMapping
    @Operation(summary = "Lister toutes les vaccinations d'un animal (US10)")
    public ResponseEntity<List<VaccinationResponse>> getVaccinations(@PathVariable Long animalId) {
        return ResponseEntity.ok(vaccinationService.getVaccinationsByAnimal(animalId));
    }

    @PostMapping
    @Operation(summary = "Ajouter un vaccin au carnet (US10)")
    public ResponseEntity<VaccinationResponse> addVaccination(
            @PathVariable Long animalId,
            @Valid @RequestBody VaccinationRequest request) {
        VaccinationResponse created = vaccinationService.addVaccination(animalId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter un vaccin spécifique")
    public ResponseEntity<VaccinationResponse> getVaccination(
            @PathVariable Long animalId,
            @PathVariable Long id) {
        return ResponseEntity.ok(vaccinationService.getVaccination(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un enregistrement vaccinal")
    public ResponseEntity<VaccinationResponse> updateVaccination(
            @PathVariable Long animalId,
            @PathVariable Long id,
            @Valid @RequestBody VaccinationRequest request) {
        return ResponseEntity.ok(vaccinationService.updateVaccination(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un vaccin")
    public ResponseEntity<Void> deleteVaccination(
            @PathVariable Long animalId,
            @PathVariable Long id) {
        vaccinationService.deleteVaccination(id);
        return ResponseEntity.noContent().build();
    }
}
