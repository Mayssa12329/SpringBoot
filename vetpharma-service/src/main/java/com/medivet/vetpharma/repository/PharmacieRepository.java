package com.medivet.vetpharma.repository;

import com.medivet.vetpharma.entity.Pharmacie;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PharmacieRepository extends JpaRepository<Pharmacie, Long> {

    List<Pharmacie> findByVilleIgnoreCase(String ville);
}
