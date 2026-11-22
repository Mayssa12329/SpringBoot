package com.medivet.petpass.dto;

import com.medivet.petpass.dto.request.*;
import com.medivet.petpass.dto.response.*;
import com.medivet.petpass.model.*;
import org.springframework.stereotype.Component;

/**
 * Mapper dédié pour convertir les entités JPA du domaine PetPass
 * en objets DTO Request/Response et vice-versa.
 * Isole complètement les contrôleurs et services des détails de persistance.
 */
@Component
public class PetPassMapper {

    // ── Animal ──────────────────────────────────────────────────────────────

    public Animal toAnimalEntity(AnimalRequest req) {
        if (req == null) return null;
        Animal animal = new Animal();
        animal.setOwnerId(req.getOwnerId());
        animal.setName(req.getName());
        animal.setSpecies(req.getSpecies());
        animal.setBreed(req.getBreed());
        animal.setBirthDate(req.getBirthDate());
        animal.setGender(req.getGender());
        animal.setWeight(req.getWeight());
        animal.setMicrochipId(req.getMicrochipId());
        animal.setPhotoUrl(req.getPhotoUrl());
        animal.setDescription(req.getDescription());
        animal.setIsSterilized(req.getIsSterilized() != null ? req.getIsSterilized() : false);
        animal.setVaccinationStatus(req.getVaccinationStatus() != null ? req.getVaccinationStatus() : "A_JOUR");
        animal.setHealthStatus(req.getHealthStatus() != null ? req.getHealthStatus() : "BON");
        return animal;
    }

    public void updateAnimalEntity(Animal existing, AnimalRequest req) {
        if (req == null || existing == null) return;
        if (req.getOwnerId() != null) existing.setOwnerId(req.getOwnerId());
        if (req.getName() != null) existing.setName(req.getName());
        if (req.getSpecies() != null) existing.setSpecies(req.getSpecies());
        existing.setBreed(req.getBreed());
        existing.setBirthDate(req.getBirthDate());
        existing.setGender(req.getGender());
        existing.setWeight(req.getWeight());
        existing.setMicrochipId(req.getMicrochipId());
        existing.setPhotoUrl(req.getPhotoUrl());
        existing.setDescription(req.getDescription());
        if (req.getIsSterilized() != null) existing.setIsSterilized(req.getIsSterilized());
        if (req.getVaccinationStatus() != null) existing.setVaccinationStatus(req.getVaccinationStatus());
        if (req.getHealthStatus() != null) existing.setHealthStatus(req.getHealthStatus());
    }

    public AnimalResponse toAnimalResponse(Animal animal) {
        if (animal == null) return null;
        AnimalResponse res = new AnimalResponse();
        res.setId(animal.getId());
        res.setOwnerId(animal.getOwnerId());
        res.setName(animal.getName());
        res.setSpecies(animal.getSpecies());
        res.setBreed(animal.getBreed());
        res.setBirthDate(animal.getBirthDate());
        res.setGender(animal.getGender());
        res.setWeight(animal.getWeight());
        res.setMicrochipId(animal.getMicrochipId());
        res.setPhotoUrl(animal.getPhotoUrl());
        res.setDescription(animal.getDescription());
        res.setIsSterilized(animal.getIsSterilized());
        res.setVaccinationStatus(animal.getVaccinationStatus());
        res.setHealthStatus(animal.getHealthStatus());
        res.setCreatedAt(animal.getCreatedAt());
        res.setUpdatedAt(animal.getUpdatedAt());
        return res;
    }

    // ── MedicalRecord ───────────────────────────────────────────────────────

    public MedicalRecord toMedicalRecordEntity(MedicalRecordRequest req) {
        if (req == null) return null;
        MedicalRecord record = new MedicalRecord();
        record.setConsultationDate(req.getConsultationDate());
        record.setDiagnosis(req.getDiagnosis());
        record.setTreatment(req.getTreatment());
        record.setVeterinarianName(req.getVeterinarianName());
        record.setNotes(req.getNotes());
        record.setNextVisitDate(req.getNextVisitDate());
        return record;
    }

    public void updateMedicalRecordEntity(MedicalRecord existing, MedicalRecordRequest req) {
        if (req == null || existing == null) return;
        if (req.getConsultationDate() != null) existing.setConsultationDate(req.getConsultationDate());
        if (req.getDiagnosis() != null) existing.setDiagnosis(req.getDiagnosis());
        existing.setTreatment(req.getTreatment());
        existing.setVeterinarianName(req.getVeterinarianName());
        existing.setNotes(req.getNotes());
        existing.setNextVisitDate(req.getNextVisitDate());
    }

    public MedicalRecordResponse toMedicalRecordResponse(MedicalRecord record) {
        if (record == null) return null;
        MedicalRecordResponse res = new MedicalRecordResponse();
        res.setId(record.getId());
        res.setAnimalId(record.getAnimalId());
        res.setConsultationDate(record.getConsultationDate());
        res.setDiagnosis(record.getDiagnosis());
        res.setTreatment(record.getTreatment());
        res.setVeterinarianName(record.getVeterinarianName());
        res.setNotes(record.getNotes());
        res.setNextVisitDate(record.getNextVisitDate());
        res.setCreatedAt(record.getCreatedAt());
        return res;
    }

    // ── Medication ──────────────────────────────────────────────────────────

    public Medication toMedicationEntity(MedicationRequest req) {
        if (req == null) return null;
        Medication med = new Medication();
        med.setMedicationName(req.getMedicationName());
        med.setDosage(req.getDosage());
        med.setStartDate(req.getStartDate());
        med.setNextDoseDate(req.getNextDoseDate());
        med.setStatus(req.getStatus() != null ? req.getStatus() : "En cours");
        med.setVeterinarianName(req.getVeterinarianName());
        return med;
    }

    public void updateMedicationEntity(Medication existing, MedicationRequest req) {
        if (req == null || existing == null) return;
        if (req.getMedicationName() != null) existing.setMedicationName(req.getMedicationName());
        existing.setDosage(req.getDosage());
        existing.setStartDate(req.getStartDate());
        existing.setNextDoseDate(req.getNextDoseDate());
        if (req.getStatus() != null) existing.setStatus(req.getStatus());
        existing.setVeterinarianName(req.getVeterinarianName());
    }

    public MedicationResponse toMedicationResponse(Medication med) {
        if (med == null) return null;
        MedicationResponse res = new MedicationResponse();
        res.setId(med.getId());
        res.setAnimalId(med.getAnimalId());
        res.setMedicationName(med.getMedicationName());
        res.setDosage(med.getDosage());
        res.setStartDate(med.getStartDate());
        res.setNextDoseDate(med.getNextDoseDate());
        res.setStatus(med.getStatus());
        res.setVeterinarianName(med.getVeterinarianName());
        res.setCreatedAt(med.getCreatedAt());
        return res;
    }

    // ── Vaccination ─────────────────────────────────────────────────────────

    public Vaccination toVaccinationEntity(VaccinationRequest req) {
        if (req == null) return null;
        Vaccination vac = new Vaccination();
        vac.setVaccineName(req.getVaccineName());
        vac.setDateAdministered(req.getDateAdministered());
        vac.setNextDueDate(req.getNextDueDate());
        vac.setBatchNumber(req.getBatchNumber());
        vac.setVeterinarianName(req.getVeterinarianName());
        vac.setStatus(req.getStatus() != null ? req.getStatus() : "À jour");
        return vac;
    }

    public void updateVaccinationEntity(Vaccination existing, VaccinationRequest req) {
        if (req == null || existing == null) return;
        if (req.getVaccineName() != null) existing.setVaccineName(req.getVaccineName());
        existing.setDateAdministered(req.getDateAdministered());
        existing.setNextDueDate(req.getNextDueDate());
        existing.setBatchNumber(req.getBatchNumber());
        existing.setVeterinarianName(req.getVeterinarianName());
        if (req.getStatus() != null) existing.setStatus(req.getStatus());
    }

    public VaccinationResponse toVaccinationResponse(Vaccination vac) {
        if (vac == null) return null;
        VaccinationResponse res = new VaccinationResponse();
        res.setId(vac.getId());
        res.setAnimalId(vac.getAnimalId());
        res.setVaccineName(vac.getVaccineName());
        res.setDateAdministered(vac.getDateAdministered());
        res.setNextDueDate(vac.getNextDueDate());
        res.setBatchNumber(vac.getBatchNumber());
        res.setVeterinarianName(vac.getVeterinarianName());
        res.setStatus(vac.getStatus());
        res.setCreatedAt(vac.getCreatedAt());
        return res;
    }

    // ── VetAuthorization ────────────────────────────────────────────────────

    public VetAuthorization toVetAuthorizationEntity(VetAuthorizationRequest req) {
        if (req == null) return null;
        VetAuthorization auth = new VetAuthorization();
        auth.setVeterinarianId(req.getVeterinarianId());
        auth.setVeterinarianName(req.getVeterinarianName());
        auth.setGrantedDate(req.getGrantedDate());
        auth.setExpiryDate(req.getExpiryDate());
        auth.setStatus(req.getStatus() != null ? req.getStatus() : "Actif");
        return auth;
    }

    public VetAuthorizationResponse toVetAuthorizationResponse(VetAuthorization auth) {
        if (auth == null) return null;
        VetAuthorizationResponse res = new VetAuthorizationResponse();
        res.setId(auth.getId());
        res.setAnimalId(auth.getAnimalId());
        res.setVeterinarianId(auth.getVeterinarianId());
        res.setVeterinarianName(auth.getVeterinarianName());
        res.setGrantedDate(auth.getGrantedDate());
        res.setExpiryDate(auth.getExpiryDate());
        res.setStatus(auth.getStatus());
        res.setCreatedAt(auth.getCreatedAt());
        return res;
    }
}
