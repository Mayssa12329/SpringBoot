package tn.medivet.adoptanimal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.medivet.adoptanimal.entity.Adoption;

public interface AdoptionRepository extends JpaRepository<Adoption, Long> {

    boolean existsByAnnonceId(Long annonceId);
}
