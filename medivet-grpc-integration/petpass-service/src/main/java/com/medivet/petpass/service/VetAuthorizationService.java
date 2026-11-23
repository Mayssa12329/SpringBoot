package com.medivet.petpass.service;

import com.medivet.petpass.dto.PetPassMapper;
import com.medivet.petpass.dto.request.VetAuthorizationRequest;
import com.medivet.petpass.dto.response.VetAuthorizationResponse;
import com.medivet.petpass.exception.ResourceNotFoundException;
import com.medivet.petpass.model.VetAuthorization;
import com.medivet.petpass.repository.AnimalRepository;
import com.medivet.petpass.repository.VetAuthorizationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service pour la gestion des autorisations d'accès vétérinaires (US12).
 */
@Service
@Transactional(readOnly = true)
public class VetAuthorizationService {

    @Autowired
    private VetAuthorizationRepository vetAuthorizationRepository;

    @Autowired
    private AnimalRepository animalRepository;

    @Autowired
    private PetPassMapper mapper;

    public List<VetAuthorizationResponse> getAuthorizationsByAnimal(Long animalId) {
        if (!animalRepository.existsById(animalId)) {
            throw new ResourceNotFoundException("Animal introuvable avec l'identifiant : " + animalId);
        }
        return vetAuthorizationRepository.findByAnimalId(animalId).stream()
                .map(mapper::toVetAuthorizationResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public VetAuthorizationResponse grantAccess(Long animalId, VetAuthorizationRequest request) {
        if (!animalRepository.existsById(animalId)) {
            throw new ResourceNotFoundException("Animal introuvable avec l'identifiant : " + animalId);
        }
        VetAuthorization auth = mapper.toVetAuthorizationEntity(request);
        auth.setAnimalId(animalId);
        VetAuthorization saved = vetAuthorizationRepository.save(auth);
        return mapper.toVetAuthorizationResponse(saved);
    }

    @Transactional
    public void revokeAccess(Long authorizationId) {
        VetAuthorization auth = vetAuthorizationRepository.findById(authorizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Autorisation introuvable avec l'identifiant : " + authorizationId));
        auth.setStatus("Révoqué");
        vetAuthorizationRepository.save(auth);
    }

    public boolean isVetAuthorized(Long animalId, Long veterinarianId) {
        return vetAuthorizationRepository.existsByAnimalIdAndVeterinarianId(animalId, veterinarianId);
    }

    // ── Méthodes de compatibilité inter-services (Entity) ───────────────────
    // Utilisées par VetBooking (AppointmentService)
    public Optional<VetAuthorization> getAuthorizationById(Long id) {
        return vetAuthorizationRepository.findById(id);
    }

    @Transactional
    public VetAuthorization grantAccess(Long animalId, VetAuthorization authorization) {
        authorization.setAnimalId(animalId);
        return vetAuthorizationRepository.save(authorization);
    }
}
