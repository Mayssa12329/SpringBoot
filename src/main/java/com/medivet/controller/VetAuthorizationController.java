package com.medivet.controller;

import com.medivet.model.VetAuthorization;
import com.medivet.service.VetAuthorizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Veterinarian Authorization management (US12)
 * Controls which veterinarians can access and add records to an animal's PetPass
 */
@RestController
@RequestMapping("/api/v1/animals/{animalId}/authorizations")
@CrossOrigin(origins = "*")
public class VetAuthorizationController {

    @Autowired
    private VetAuthorizationService vetAuthorizationService;

    /**
     * GET /api/v1/animals/{animalId}/authorizations
     * List all veterinarians authorized for this animal (US12)
     */
    @GetMapping
    public ResponseEntity<List<VetAuthorization>> getAuthorizations(@PathVariable Long animalId) {
        return ResponseEntity.ok(vetAuthorizationService.getAuthorizationsByAnimal(animalId));
    }

    /**
     * POST /api/v1/animals/{animalId}/authorizations
     * Grant access to a veterinarian (US12 - Accorder un accès vétérinaire)
     */
    @PostMapping
    public ResponseEntity<VetAuthorization> grantAccess(
            @PathVariable Long animalId,
            @RequestBody VetAuthorization authorization) {
        VetAuthorization created = vetAuthorizationService.grantAccess(animalId, authorization);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * DELETE /api/v1/animals/{animalId}/authorizations/{id}
     * Revoke veterinarian access (US12)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> revokeAccess(
            @PathVariable Long animalId,
            @PathVariable Long id) {
        if (vetAuthorizationService.revokeAccess(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * GET /api/v1/animals/{animalId}/authorizations/check?vetId={id}
     * Check if a specific veterinarian is authorized for this animal (US12)
     */
    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkAuthorization(
            @PathVariable Long animalId,
            @RequestParam Long vetId) {
        boolean authorized = vetAuthorizationService.isVetAuthorized(animalId, vetId);
        return ResponseEntity.ok(Map.of("authorized", authorized));
    }
}

