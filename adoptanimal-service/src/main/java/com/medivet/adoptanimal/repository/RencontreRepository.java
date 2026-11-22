package com.medivet.adoptanimal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.medivet.adoptanimal.model.Rencontre;
import com.medivet.adoptanimal.model.StatutRencontre;

public interface RencontreRepository extends JpaRepository<Rencontre, Long> {

    boolean existsByCandidatureIdAndStatut(Long candidatureId, StatutRencontre statut);
}
