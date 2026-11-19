package tn.medivet.adoptanimal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.medivet.adoptanimal.entity.Candidature;
import tn.medivet.adoptanimal.entity.StatutCandidature;

import java.util.Collection;
import java.util.List;

public interface CandidatureRepository extends JpaRepository<Candidature, Long> {

    List<Candidature> findByAnnonceIdOrderByCreatedAtAsc(Long annonceId);

    List<Candidature> findByAnnonceIdAndIdNot(Long annonceId, Long id);

    boolean existsByAnnonceIdAndCandidatIdAndStatutIn(Long annonceId, Long candidatId,
                                                      Collection<StatutCandidature> statuts);
}
