package com.medivet.petpass.controller;

import com.medivet.petpass.dto.request.VetAuthorizationRequest;
import com.medivet.petpass.dto.response.VetAuthorizationResponse;
import com.medivet.petpass.service.VetAuthorizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller pour la gestion des autorisations vétérinaires (PetPass - US12).
 */
@RestController
@RequestMapping("/api/v1/animals/{animalId}/authorizations")
@CrossOrigin(origins = "*")
@Tag(name = "PetPass - Autorisations Vétérinaires", description = "Contrôle d'accès des praticiens au carnet de santé de l'animal")
public class VetAuthorizationController {

    @Autowired
    private VetAuthorizationService vetAuthorizationService;

    @GetMapping
    @Operation(summary = "Lister les vétérinaires autorisés pour cet animal (US12)")
    public ResponseEntity<List<VetAuthorizationResponse>> getAuthorizations(@PathVariable Long animalId) {
        return ResponseEntity.ok(vetAuthorizationService.getAuthorizationsByAnimal(animalId));
    }

    @PostMapping
    @Operation(summary = "Accorder un accès à un vétérinaire (US12)")
    public ResponseEntity<VetAuthorizationResponse> grantAccess(
            @PathVariable Long animalId,
            @Valid @RequestBody VetAuthorizationRequest request) {
        VetAuthorizationResponse created = vetAuthorizationService.grantAccess(animalId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Révoquer l'accès d'un vétérinaire (US12)")
    public ResponseEntity<Void> revokeAccess(
            @PathVariable Long animalId,
            @PathVariable Long id) {
        vetAuthorizationService.revokeAccess(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/check")
    @Operation(summary = "Vérifier si un vétérinaire est autorisé (US12)")
    public ResponseEntity<Map<String, Boolean>> checkAuthorization(
            @PathVariable(required = false) Long animalId,
            @RequestParam Long vetId) {
        boolean authorized = vetAuthorizationService.isVetAuthorized(animalId, vetId);
        return ResponseEntity.ok(Map.of("authorized", authorized));
    }

    @PostMapping("/api/v1/vet-authorizations")
    @Operation(summary = "Créer une autorisation vétérinaire directement (Liaison Inter-Service VetBooking)")
    public ResponseEntity<VetAuthorizationResponse> createDirectAuthorization(@RequestBody Map<String, Object> body) {
        Long aId = Long.valueOf(body.get("animalId").toString());
        VetAuthorizationRequest req = new VetAuthorizationRequest();
        req.setVeterinarianId(Long.valueOf(body.get("veterinarianId").toString()));
        if (body.get("veterinarianName") != null) req.setVeterinarianName(body.get("veterinarianName").toString());
        if (body.get("status") != null) req.setStatus(body.get("status").toString());
        return ResponseEntity.status(HttpStatus.CREATED).body(vetAuthorizationService.grantAccess(aId, req));
    }
}
