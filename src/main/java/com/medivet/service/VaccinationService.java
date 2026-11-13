package com.medivet.service;

import com.medivet.model.Vaccination;
import com.medivet.repository.VaccinationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service for Vaccination management (US10 - Carnet de vaccins)
 * Authorized veterinarians or animal owners can add vaccinations
 */
@Service
public class VaccinationService {

    @Autowired
    private VaccinationRepository vaccinationRepository;

    public List<Vaccination> getVaccinationsByAnimal(Long animalId) {
        return vaccinationRepository.findByAnimalIdOrderByDateAdministeredDesc(animalId);
    }

    public Vaccination addVaccination(Long animalId, Vaccination vaccination) {
        vaccination.setAnimalId(animalId);
        return vaccinationRepository.save(vaccination);
    }

    public Optional<Vaccination> updateVaccination(Long id, Vaccination updated) {
        return vaccinationRepository.findById(id).map(existing -> {
            existing.setVaccineName(updated.getVaccineName());
            existing.setDateAdministered(updated.getDateAdministered());
            existing.setNextDueDate(updated.getNextDueDate());
            existing.setBatchNumber(updated.getBatchNumber());
            existing.setVeterinarianName(updated.getVeterinarianName());
            existing.setStatus(updated.getStatus());
            return vaccinationRepository.save(existing);
        });
    }

    public boolean deleteVaccination(Long id) {
        if (vaccinationRepository.existsById(id)) {
            vaccinationRepository.deleteById(id);
            return true;
        }
        return false;
    }
}

