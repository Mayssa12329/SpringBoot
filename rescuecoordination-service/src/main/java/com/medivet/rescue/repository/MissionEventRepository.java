package com.medivet.rescue.repository;

import java.util.List;

import com.medivet.rescue.model.MissionEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MissionEventRepository extends JpaRepository<MissionEvent, Long> {

    List<MissionEvent> findByMissionIdOrderByOccurredAtAscIdAsc(Long missionId);
}
