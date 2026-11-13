package com.medivet.repository;

import com.medivet.model.Vaccination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VaccinationRepository extends JpaRepository<Vaccination, Long> {
    List<Vaccination> findByAnimalIdOrderByDateAdministeredDesc(Long animalId);
}

