package com.medivet.rescue.repository;

import java.util.List;

import com.medivet.rescue.model.MissionPosition;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MissionPositionRepository extends JpaRepository<MissionPosition, Long> {

    List<MissionPosition> findByMissionIdOrderByRecordedAtAsc(Long missionId);
}
