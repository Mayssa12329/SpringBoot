package com.medivet.helpanimal.repository;

import java.util.List;

import com.medivet.helpanimal.domain.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByTargetTypeAndTargetIdOrderByCreatedAtAsc(String targetType, Long targetId);

    List<AuditLog> findAllByOrderByCreatedAtDesc();
}
