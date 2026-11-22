package com.medivet.petpass.service;

import com.medivet.petpass.dto.PetPassMapper;
import com.medivet.petpass.dto.request.MedicalRecordRequest;
import com.medivet.petpass.dto.response.MedicalRecordResponse;
import com.medivet.petpass.exception.ResourceNotFoundException;
import com.medivet.petpass.model.MedicalRecord;
import com.medivet.petpass.repository.AnimalRepository;
import com.medivet.petpass.repository.MedicalRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service pour la gestion du dossier médical et des consultations (US09).
 */
@Service
@Transactional(readOnly = true)
public class MedicalRecordService {

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    @Autowired
    private AnimalRepository animalRepository;

    @Autowired
    private PetPassMapper mapper;

    public List<MedicalRecordResponse> getMedicalRecordsByAnimal(Long animalId) {
        if (!animalRepository.existsById(animalId)) {
            throw new ResourceNotFoundException("Animal introuvable avec l'identifiant : " + animalId);
        }
        return medicalRecordRepository.findByAnimalIdOrderByConsultationDateDesc(animalId).stream()
                .map(mapper::toMedicalRecordResponse)
                .collect(Collectors.toList());
    }

    public MedicalRecordResponse getMedicalRecord(Long id) {
        return medicalRecordRepository.findById(id)
                .map(mapper::toMedicalRecordResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Acte médical introuvable avec l'identifiant : " + id));
    }

    @Transactional
    public MedicalRecordResponse addMedicalRecord(Long animalId, MedicalRecordRequest request) {
        if (!animalRepository.existsById(animalId)) {
            throw new ResourceNotFoundException("Animal introuvable avec l'identifiant : " + animalId);
        }
        MedicalRecord record = mapper.toMedicalRecordEntity(request);
        record.setAnimalId(animalId);
        MedicalRecord saved = medicalRecordRepository.save(record);
        return mapper.toMedicalRecordResponse(saved);
    }

    @Transactional
    public MedicalRecordResponse updateMedicalRecord(Long id, MedicalRecordRequest request) {
        MedicalRecord existing = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Acte médical introuvable avec l'identifiant : " + id));
        mapper.updateMedicalRecordEntity(existing, request);
        MedicalRecord updated = medicalRecordRepository.save(existing);
        return mapper.toMedicalRecordResponse(updated);
    }

    @Transactional
    public void deleteMedicalRecord(Long id) {
        if (!medicalRecordRepository.existsById(id)) {
            throw new ResourceNotFoundException("Acte médical introuvable avec l'identifiant : " + id);
        }
        medicalRecordRepository.deleteById(id);
    }

    // ── Méthodes de compatibilité inter-services (Entity) ───────────────────
    // Utilisées par VetBooking (AppointmentService)
    public Optional<MedicalRecord> getMedicalRecordById(Long id) {
        return medicalRecordRepository.findById(id);
    }

    @Transactional
    public MedicalRecord addMedicalRecord(Long animalId, MedicalRecord record) {
        record.setAnimalId(animalId);
        return medicalRecordRepository.save(record);
    }
}
