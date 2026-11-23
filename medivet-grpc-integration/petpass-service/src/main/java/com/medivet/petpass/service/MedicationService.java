package com.medivet.petpass.service;

import com.medivet.petpass.dto.PetPassMapper;
import com.medivet.petpass.dto.request.MedicationRequest;
import com.medivet.petpass.dto.response.MedicationResponse;
import com.medivet.petpass.exception.ResourceNotFoundException;
import com.medivet.petpass.model.Medication;
import com.medivet.petpass.repository.AnimalRepository;
import com.medivet.petpass.repository.MedicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service pour la gestion des prescriptions et médicaments en cours (PetPass - US09).
 */
@Service
@Transactional(readOnly = true)
public class MedicationService {

    @Autowired
    private MedicationRepository medicationRepository;

    @Autowired
    private AnimalRepository animalRepository;

    @Autowired
    private PetPassMapper mapper;

    public List<MedicationResponse> getMedicationsByAnimal(Long animalId) {
        if (!animalRepository.existsById(animalId)) {
            throw new ResourceNotFoundException("Animal introuvable avec l'identifiant : " + animalId);
        }
        return medicationRepository.findByAnimalIdOrderByCreatedAtDesc(animalId).stream()
                .map(mapper::toMedicationResponse)
                .collect(Collectors.toList());
    }

    public MedicationResponse getMedication(Long id) {
        return medicationRepository.findById(id)
                .map(mapper::toMedicationResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Traitement introuvable avec l'identifiant : " + id));
    }

    @Transactional
    public MedicationResponse addMedication(Long animalId, MedicationRequest request) {
        if (!animalRepository.existsById(animalId)) {
            throw new ResourceNotFoundException("Animal introuvable avec l'identifiant : " + animalId);
        }
        Medication medication = mapper.toMedicationEntity(request);
        medication.setAnimalId(animalId);
        Medication saved = medicationRepository.save(medication);
        return mapper.toMedicationResponse(saved);
    }

    @Transactional
    public MedicationResponse updateMedication(Long id, MedicationRequest request) {
        Medication existing = medicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Traitement introuvable avec l'identifiant : " + id));
        mapper.updateMedicationEntity(existing, request);
        Medication updated = medicationRepository.save(existing);
        return mapper.toMedicationResponse(updated);
    }

    @Transactional
    public void deleteMedication(Long id) {
        if (!medicationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Traitement introuvable avec l'identifiant : " + id);
        }
        medicationRepository.deleteById(id);
    }
}
