package com.medivet.petpass.repository;

import com.medivet.petpass.model.Animal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnimalRepository extends JpaRepository<Animal, Long> {
    List<Animal> findByOwnerId(Long ownerId);
    boolean existsByMicrochipId(String microchipId);
}

