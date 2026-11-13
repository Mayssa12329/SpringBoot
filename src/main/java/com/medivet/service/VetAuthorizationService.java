package com.medivet.service;

import com.medivet.model.VetAuthorization;
import com.medivet.repository.VetAuthorizationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service for Veterinarian Authorization management (US12 - Carnet d'accès)
 * Controls which vets can access and add records to an animal's PetPass
 */
@Service
public class VetAuthorizationService {

    @Autowired
    private VetAuthorizationRepository vetAuthorizationRepository;

    public List<VetAuthorization> getAuthorizationsByAnimal(Long animalId) {
        return vetAuthorizationRepository.findByAnimalId(animalId);
    }

    public VetAuthorization grantAccess(Long animalId, VetAuthorization authorization) {
        authorization.setAnimalId(animalId);
        return vetAuthorizationRepository.save(authorization);
    }

    public boolean revokeAccess(Long authorizationId) {
        return vetAuthorizationRepository.findById(authorizationId).map(auth -> {
            auth.setStatus("Révoqué");
            vetAuthorizationRepository.save(auth);
            return true;
        }).orElse(false);
    }

    public boolean isVetAuthorized(Long animalId, Long veterinarianId) {
        return vetAuthorizationRepository.existsByAnimalIdAndVeterinarianId(animalId, veterinarianId);
    }

    public Optional<VetAuthorization> getAuthorizationById(Long id) {
        return vetAuthorizationRepository.findById(id);
    }
}

