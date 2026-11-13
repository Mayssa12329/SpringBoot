package com.medivet.service;

import com.medivet.model.Medication;
import com.medivet.repository.MedicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service for Medication management (US09 - Prescriptions)
 * Tracks active medications and treatments per animal
 */
@Service
public class MedicationService {

    @Autowired
    private MedicationRepository medicationRepository;

    public List<Medication> getMedicationsByAnimal(Long animalId) {
        return medicationRepository.findByAnimalIdOrderByCreatedAtDesc(animalId);
    }

    public Medication addMedication(Long animalId, Medication medication) {
        medication.setAnimalId(animalId);
        return medicationRepository.save(medication);
    }

    public Optional<Medication> updateMedication(Long id, Medication updated) {
        return medicationRepository.findById(id).map(existing -> {
            existing.setMedicationName(updated.getMedicationName());
            existing.setDosage(updated.getDosage());
            existing.setStartDate(updated.getStartDate());
            existing.setNextDoseDate(updated.getNextDoseDate());
            existing.setStatus(updated.getStatus());
            existing.setVeterinarianName(updated.getVeterinarianName());
            return medicationRepository.save(existing);
        });
    }

    public boolean deleteMedication(Long id) {
        if (medicationRepository.existsById(id)) {
            medicationRepository.deleteById(id);
            return true;
        }
        return false;
    }
}

