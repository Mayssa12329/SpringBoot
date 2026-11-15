package com.medivet.petpass.controller;

import com.medivet.petpass.dto.request.AnimalRequest;
import com.medivet.petpass.dto.response.AnimalResponse;
import com.medivet.petpass.service.AnimalService;
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
 * REST Controller pour la gestion des profils animaux (PetPass - US07).
 */
@RestController
@RequestMapping("/api/v1/animals")
@CrossOrigin(origins = "*")
@Tag(name = "PetPass - Animaux", description = "Gestion des animaux de compagnie et de leur profil")
public class AnimalController {

    @Autowired
    private AnimalService animalService;

    @GetMapping
    @Operation(summary = "Lister tous les animaux (Usage administratif)")
    public ResponseEntity<List<AnimalResponse>> getAllAnimals() {
        return ResponseEntity.ok(animalService.getAllAnimals());
    }

    @GetMapping("/my-pets")
    @Operation(summary = "Lister les animaux d'un propriétaire donné (US07)")
    public ResponseEntity<List<AnimalResponse>> getMyPets(@RequestParam Long ownerId) {
        return ResponseEntity.ok(animalService.getAnimalsByOwner(ownerId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir les détails d'un animal par son ID")
    public ResponseEntity<AnimalResponse> getAnimalById(@PathVariable Long id) {
        return ResponseEntity.ok(animalService.getAnimal(id));
    }

    @PostMapping
    @Operation(summary = "Créer un nouveau profil animal (US07)")
    public ResponseEntity<AnimalResponse> createAnimal(@Valid @RequestBody AnimalRequest request) {
        AnimalResponse created = animalService.createAnimal(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un profil animal existant")
    public ResponseEntity<AnimalResponse> updateAnimal(
            @PathVariable Long id,
            @Valid @RequestBody AnimalRequest request) {
        return ResponseEntity.ok(animalService.updateAnimal(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un profil animal")
    public ResponseEntity<Void> deleteAnimal(@PathVariable Long id) {
        animalService.deleteAnimal(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/check-microchip")
    @Operation(summary = "Vérifier si un numéro de puce existe déjà (US07 / I-CAD)")
    public ResponseEntity<Map<String, Boolean>> checkMicrochip(@RequestParam String microchipId) {
        boolean exists = animalService.microchipExists(microchipId);
        return ResponseEntity.ok(Map.of("exists", exists));
    }
}
