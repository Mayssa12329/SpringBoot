package com.medivet.controller;

import com.medivet.model.Vaccination;
import com.medivet.service.VaccinationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Vaccination management (US10 - Carnet de vaccins)
 * Authorized veterinarians or animal owners can read and add vaccination records
 */
@RestController
@RequestMapping("/api/v1/animals/{animalId}/vaccinations")
@CrossOrigin(origins = "*")
public class VaccinationController {

    @Autowired
    private VaccinationService vaccinationService;

    /**
     * GET /api/v1/animals/{animalId}/vaccinations
     * Retrieve all vaccinations for a specific animal (US10)
     */
    @GetMapping
    public ResponseEntity<List<Vaccination>> getVaccinations(@PathVariable Long animalId) {
        return ResponseEntity.ok(vaccinationService.getVaccinationsByAnimal(animalId));
    }

    /**
     * POST /api/v1/animals/{animalId}/vaccinations
     * Add a new vaccination record - requires vet authorization or owner (US10)
     */
    @PostMapping
    public ResponseEntity<Vaccination> addVaccination(
            @PathVariable Long animalId,
            @RequestBody Vaccination vaccination) {
        Vaccination created = vaccinationService.addVaccination(animalId, vaccination);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/v1/animals/{animalId}/vaccinations/{id}
     * Update an existing vaccination record
     */
    @PutMapping("/{id}")
    public ResponseEntity<Vaccination> updateVaccination(
            @PathVariable Long animalId,
            @PathVariable Long id,
            @RequestBody Vaccination vaccination) {
        return vaccinationService.updateVaccination(id, vaccination)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * DELETE /api/v1/animals/{animalId}/vaccinations/{id}
     * Delete a vaccination record
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVaccination(
            @PathVariable Long animalId,
            @PathVariable Long id) {
        if (vaccinationService.deleteVaccination(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}

