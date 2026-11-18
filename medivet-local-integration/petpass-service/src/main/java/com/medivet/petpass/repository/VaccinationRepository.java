package com.medivet.petpass.repository;

import com.medivet.petpass.model.Vaccination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VaccinationRepository extends JpaRepository<Vaccination, Long> {
    List<Vaccination> findByAnimalIdOrderByDateAdministeredDesc(Long animalId);
}

