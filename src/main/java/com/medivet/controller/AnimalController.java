package com.medivet.controller;

import com.medivet.model.Animal;
import com.medivet.service.AnimalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Animal management (US07 - PetPass)
 * Endpoints for CRUD operations, owner queries and microchip validation
 */
@RestController
@RequestMapping("/api/v1/animals")
@CrossOrigin(origins = "*")
public class AnimalController {

    @Autowired
    private AnimalService animalService;

    /**
     * GET /api/v1/animals
     * Retrieve all animals (admin use)
     */
    @GetMapping
    public ResponseEntity<List<Animal>> getAllAnimals() {
        return ResponseEntity.ok(animalService.getAllAnimals());
    }

    /**
     * GET /api/v1/animals/my-pets?ownerId={id}
     * Retrieve animals belonging to a specific owner (US07)
     */
    @GetMapping("/my-pets")
    public ResponseEntity<List<Animal>> getMyPets(@RequestParam Long ownerId) {
        return ResponseEntity.ok(animalService.getAnimalsByOwner(ownerId));
    }

    /**
     * GET /api/v1/animals/{id}
     * Retrieve a specific animal by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Animal> getAnimalById(@PathVariable Long id) {
        return animalService.getAnimalById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/v1/animals
     * Create a new animal profile (US07)
     */
    @PostMapping
    public ResponseEntity<Animal> createAnimal(@RequestBody Animal animal) {
        Animal created = animalService.createAnimal(animal);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/v1/animals/{id}
     * Update an existing animal profile
     */
    @PutMapping("/{id}")
    public ResponseEntity<Animal> updateAnimal(@PathVariable Long id, @RequestBody Animal animal) {
        return animalService.updateAnimal(id, animal)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * DELETE /api/v1/animals/{id}
     * Delete an animal profile
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnimal(@PathVariable Long id) {
        if (animalService.deleteAnimal(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * GET /api/v1/animals/check-microchip?microchipId={id}
     * Validate microchip uniqueness (US07 - SOAP integration)
     */
    @GetMapping("/check-microchip")
    public ResponseEntity<Map<String, Boolean>> checkMicrochip(@RequestParam String microchipId) {
        boolean exists = animalService.microchipExists(microchipId);
        return ResponseEntity.ok(Map.of("exists", exists));
    }
}

