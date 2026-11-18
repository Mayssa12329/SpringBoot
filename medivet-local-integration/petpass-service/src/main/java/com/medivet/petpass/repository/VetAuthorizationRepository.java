package com.medivet.petpass.repository;

import com.medivet.petpass.model.VetAuthorization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VetAuthorizationRepository extends JpaRepository<VetAuthorization, Long> {
    List<VetAuthorization> findByAnimalId(Long animalId);
    boolean existsByAnimalIdAndVeterinarianId(Long animalId, Long veterinarianId);
}

