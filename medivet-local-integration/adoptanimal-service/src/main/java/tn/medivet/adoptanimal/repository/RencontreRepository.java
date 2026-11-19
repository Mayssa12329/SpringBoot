package tn.medivet.adoptanimal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.medivet.adoptanimal.entity.Rencontre;
import tn.medivet.adoptanimal.entity.StatutRencontre;

public interface RencontreRepository extends JpaRepository<Rencontre, Long> {

    boolean existsByCandidatureIdAndStatut(Long candidatureId, StatutRencontre statut);
}
