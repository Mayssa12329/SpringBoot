package com.medivet.rescue.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.medivet.rescue.model.Mission;
import com.medivet.rescue.model.MissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MissionRepository extends JpaRepository<Mission, Long> {

    Optional<Mission> findByReportId(Long reportId);

    /** RM05 : missions attribuees depuis trop longtemps sans reponse. */
    List<Mission> findByStatusAndAssignedAtBefore(MissionStatus status, Instant limit);

    /** Canal de dispatch : missions a proposer a un intervenant qui se connecte. */
    List<Mission> findByStatusOrderByCreatedAtAsc(MissionStatus status);
}
