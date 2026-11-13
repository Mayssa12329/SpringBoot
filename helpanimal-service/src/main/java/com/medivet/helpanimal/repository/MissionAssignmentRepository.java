package com.medivet.helpanimal.repository;

import java.util.Optional;

import com.medivet.helpanimal.domain.MissionAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MissionAssignmentRepository extends JpaRepository<MissionAssignment, Long> {

    Optional<MissionAssignment> findByReportId(Long reportId);
}
