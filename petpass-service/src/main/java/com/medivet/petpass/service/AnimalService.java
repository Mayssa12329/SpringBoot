package com.medivet.petpass.service;

import com.medivet.petpass.dto.PetPassMapper;
import com.medivet.petpass.dto.request.AnimalRequest;
import com.medivet.petpass.dto.response.AnimalResponse;
import com.medivet.petpass.exception.DuplicateResourceException;
import com.medivet.petpass.exception.ResourceNotFoundException;
import com.medivet.petpass.model.Animal;
import com.medivet.petpass.repository.AnimalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service pour la gestion des animaux de compagnie (PetPass).
 * Fournit les opérations CRUD, requêtes par propriétaire et vérification de puce.
 */
@Service
@Transactional(readOnly = true)
public class AnimalService {

    @Autowired
    private AnimalRepository animalRepository;

    @Autowired
    private PetPassMapper mapper;

    // ── Queries (DTO) ────────────────────────────────────────────────────────

    public List<AnimalResponse> getAllAnimals() {
        return animalRepository.findAll().stream()
                .map(mapper::toAnimalResponse)
                .collect(Collectors.toList());
    }

    public List<AnimalResponse> getAnimalsByOwner(Long ownerId) {
        return animalRepository.findByOwnerId(ownerId).stream()
                .map(mapper::toAnimalResponse)
                .collect(Collectors.toList());
    }

    public AnimalResponse getAnimal(Long id) {
        return animalRepository.findById(id)
                .map(mapper::toAnimalResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Animal introuvable avec l'identifiant : " + id));
    }

    // ── Commandes (DTO) ──────────────────────────────────────────────────────

    @Transactional
    public AnimalResponse createAnimal(AnimalRequest request) {
        if (request.getMicrochipId() != null && !request.getMicrochipId().isBlank()) {
            if (animalRepository.existsByMicrochipId(request.getMicrochipId())) {
                throw new DuplicateResourceException("Un animal avec le numéro de puce " + request.getMicrochipId() + " existe déjà.");
            }
        }
        Animal entity = mapper.toAnimalEntity(request);
        Animal saved = animalRepository.save(entity);
        return mapper.toAnimalResponse(saved);
    }

    @Transactional
    public AnimalResponse updateAnimal(Long id, AnimalRequest request) {
        Animal existing = animalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Impossible de mettre à jour : animal introuvable avec l'identifiant : " + id));

        if (request.getMicrochipId() != null && !request.getMicrochipId().isBlank()
                && !request.getMicrochipId().equals(existing.getMicrochipId())) {
            if (animalRepository.existsByMicrochipId(request.getMicrochipId())) {
                throw new DuplicateResourceException("Le numéro de puce " + request.getMicrochipId() + " est déjà attribué à un autre animal.");
            }
        }

        mapper.updateAnimalEntity(existing, request);
        Animal updated = animalRepository.save(existing);
        return mapper.toAnimalResponse(updated);
    }

    @Transactional
    public void deleteAnimal(Long id) {
        if (!animalRepository.existsById(id)) {
            throw new ResourceNotFoundException("Impossible de supprimer : animal introuvable avec l'identifiant : " + id);
        }
        animalRepository.deleteById(id);
    }

    public boolean microchipExists(String microchipId) {
        return animalRepository.existsByMicrochipId(microchipId);
    }

    // ── Méthodes de compatibilité inter-services (Entity) ───────────────────
    // Utilisées notamment par VetBooking (AppointmentService)
    public Optional<Animal> getAnimalById(Long id) {
        return animalRepository.findById(id);
    }

    @Transactional
    public Animal createAnimal(Animal animal) {
        return animalRepository.save(animal);
    }
}
