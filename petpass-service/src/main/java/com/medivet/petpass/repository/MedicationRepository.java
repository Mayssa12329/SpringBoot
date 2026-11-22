package com.medivet.petpass.repository;

import com.medivet.petpass.model.Medication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicationRepository extends JpaRepository<Medication, Long> {
    List<Medication> findByAnimalIdOrderByCreatedAtDesc(Long animalId);
}

