package com.medivet.petpass.service;

import com.medivet.petpass.dto.PetPassMapper;
import com.medivet.petpass.dto.request.VaccinationRequest;
import com.medivet.petpass.dto.response.VaccinationResponse;
import com.medivet.petpass.exception.ResourceNotFoundException;
import com.medivet.petpass.model.Vaccination;
import com.medivet.petpass.repository.AnimalRepository;
import com.medivet.petpass.repository.VaccinationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service pour la gestion des vaccinations (PetPass - US10).
 */
@Service
@Transactional(readOnly = true)
public class VaccinationService {

    @Autowired
    private VaccinationRepository vaccinationRepository;

    @Autowired
    private AnimalRepository animalRepository;

    @Autowired
    private PetPassMapper mapper;

    public List<VaccinationResponse> getVaccinationsByAnimal(Long animalId) {
        if (!animalRepository.existsById(animalId)) {
            throw new ResourceNotFoundException("Animal introuvable avec l'identifiant : " + animalId);
        }
        return vaccinationRepository.findByAnimalIdOrderByDateAdministeredDesc(animalId).stream()
                .map(mapper::toVaccinationResponse)
                .collect(Collectors.toList());
    }

    public VaccinationResponse getVaccination(Long id) {
        return vaccinationRepository.findById(id)
                .map(mapper::toVaccinationResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Vaccination introuvable avec l'identifiant : " + id));
    }

    @Transactional
    public VaccinationResponse addVaccination(Long animalId, VaccinationRequest request) {
        if (!animalRepository.existsById(animalId)) {
            throw new ResourceNotFoundException("Animal introuvable avec l'identifiant : " + animalId);
        }
        Vaccination vaccination = mapper.toVaccinationEntity(request);
        vaccination.setAnimalId(animalId);
        Vaccination saved = vaccinationRepository.save(vaccination);
        return mapper.toVaccinationResponse(saved);
    }

    @Transactional
    public VaccinationResponse updateVaccination(Long id, VaccinationRequest request) {
        Vaccination existing = vaccinationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vaccination introuvable avec l'identifiant : " + id));
        mapper.updateVaccinationEntity(existing, request);
        Vaccination updated = vaccinationRepository.save(existing);
        return mapper.toVaccinationResponse(updated);
    }

    @Transactional
    public void deleteVaccination(Long id) {
        if (!vaccinationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Vaccination introuvable avec l'identifiant : " + id);
        }
        vaccinationRepository.deleteById(id);
    }
}
