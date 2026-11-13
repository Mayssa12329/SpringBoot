package com.medivet.service;

import com.medivet.model.Animal;
import com.medivet.repository.AnimalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service for Animal management (US07 - PetPass)
 * Handles CRUD operations and owner-based queries
 */
@Service
public class AnimalService {

    @Autowired
    private AnimalRepository animalRepository;

    public List<Animal> getAllAnimals() {
        return animalRepository.findAll();
    }

    public List<Animal> getAnimalsByOwner(Long ownerId) {
        return animalRepository.findByOwnerId(ownerId);
    }

    public Optional<Animal> getAnimalById(Long id) {
        return animalRepository.findById(id);
    }

    public Animal createAnimal(Animal animal) {
        return animalRepository.save(animal);
    }

    public Optional<Animal> updateAnimal(Long id, Animal updatedAnimal) {
        return animalRepository.findById(id).map(existing -> {
            existing.setName(updatedAnimal.getName());
            existing.setSpecies(updatedAnimal.getSpecies());
            existing.setBreed(updatedAnimal.getBreed());
            existing.setBirthDate(updatedAnimal.getBirthDate());
            existing.setGender(updatedAnimal.getGender());
            existing.setWeight(updatedAnimal.getWeight());
            existing.setMicrochipId(updatedAnimal.getMicrochipId());
            existing.setPhotoUrl(updatedAnimal.getPhotoUrl());
            existing.setDescription(updatedAnimal.getDescription());
            existing.setIsSterilized(updatedAnimal.getIsSterilized());
            existing.setVaccinationStatus(updatedAnimal.getVaccinationStatus());
            existing.setHealthStatus(updatedAnimal.getHealthStatus());
            return animalRepository.save(existing);
        });
    }

    public boolean deleteAnimal(Long id) {
        if (animalRepository.existsById(id)) {
            animalRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public boolean microchipExists(String microchipId) {
        return animalRepository.existsByMicrochipId(microchipId);
    }
}

