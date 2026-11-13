package com.medivet.service;

import com.medivet.model.MedicalRecord;
import com.medivet.repository.MedicalRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service for Medical Records / Consultations management (US09)
 * Manages consultation history, diagnoses, and treatments
 */
@Service
public class MedicalRecordService {

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    public List<MedicalRecord> getMedicalRecordsByAnimal(Long animalId) {
        return medicalRecordRepository.findByAnimalIdOrderByConsultationDateDesc(animalId);
    }

    public MedicalRecord addMedicalRecord(Long animalId, MedicalRecord record) {
        record.setAnimalId(animalId);
        return medicalRecordRepository.save(record);
    }

    public Optional<MedicalRecord> getMedicalRecordById(Long id) {
        return medicalRecordRepository.findById(id);
    }

    public Optional<MedicalRecord> updateMedicalRecord(Long id, MedicalRecord updated) {
        return medicalRecordRepository.findById(id).map(existing -> {
            existing.setConsultationDate(updated.getConsultationDate());
            existing.setDiagnosis(updated.getDiagnosis());
            existing.setTreatment(updated.getTreatment());
            existing.setVeterinarianName(updated.getVeterinarianName());
            existing.setNotes(updated.getNotes());
            existing.setNextVisitDate(updated.getNextVisitDate());
            return medicalRecordRepository.save(existing);
        });
    }

    public boolean deleteMedicalRecord(Long id) {
        if (medicalRecordRepository.existsById(id)) {
            medicalRecordRepository.deleteById(id);
            return true;
        }
        return false;
    }
}

