package com.medivet.adoptanimal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.medivet.adoptanimal.model.DecisionHistorique;

public interface DecisionHistoriqueRepository extends JpaRepository<DecisionHistorique, Long> {
}
