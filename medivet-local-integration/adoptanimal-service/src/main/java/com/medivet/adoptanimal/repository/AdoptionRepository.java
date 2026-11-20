package com.medivet.adoptanimal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.medivet.adoptanimal.model.Adoption;

public interface AdoptionRepository extends JpaRepository<Adoption, Long> {

    boolean existsByAnnonceId(Long annonceId);
}
