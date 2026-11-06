package tn.medivet.adoptanimal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.medivet.adoptanimal.entity.DecisionHistorique;

public interface DecisionHistoriqueRepository extends JpaRepository<DecisionHistorique, Long> {
}
