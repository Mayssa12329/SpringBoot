package com.medivet.petpass.repository;

import com.medivet.petpass.model.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {
    List<MedicalRecord> findByAnimalIdOrderByConsultationDateDesc(Long animalId);
}

