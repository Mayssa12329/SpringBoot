package com.medivet.vetbooking.repository;

import com.medivet.vetbooking.entity.Vet;
import com.medivet.vetbooking.enums.ConsultationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VetRepository extends JpaRepository<Vet, Long> {

    Optional<Vet> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Vet> findByActiveTrue();

    List<Vet> findByActiveTrueAndCityIgnoreCase(String city);

    /** Filter by single consultation type — US13 / RM07. */
    List<Vet> findByActiveTrueAndConsultationType(ConsultationType consultationType);

    /** Filter by city AND single consultation type — US13 / RM07. */
    List<Vet> findByActiveTrueAndCityIgnoreCaseAndConsultationType(
            String city, ConsultationType consultationType);
}
