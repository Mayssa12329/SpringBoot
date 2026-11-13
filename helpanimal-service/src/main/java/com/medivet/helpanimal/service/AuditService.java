package com.medivet.helpanimal.service;

import java.time.Clock;
import java.util.List;

import com.medivet.helpanimal.domain.AuditLog;
import com.medivet.helpanimal.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** RM15 : journalisation des actions sensibles. */
@Service
public class AuditService {

    public static final String TARGET_REPORT = "REPORT";
    public static final String ACTION_REPORT_HIDDEN = "REPORT_HIDDEN";
    public static final String ACTION_REPORT_REJECTED = "REPORT_REJECTED";

    private final AuditLogRepository auditLogRepository;
    private final Clock clock;

    public AuditService(AuditLogRepository auditLogRepository, Clock clock) {
        this.auditLogRepository = auditLogRepository;
        this.clock = clock;
    }

    @Transactional
    public AuditLog log(String action, String targetType, Long targetId, Long actorId, String details) {
        return auditLogRepository.save(new AuditLog(action, targetType, targetId, actorId, details, clock.instant()));
    }

    @Transactional(readOnly = true)
    public List<AuditLog> findAll() {
        return auditLogRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<AuditLog> findForReport(Long reportId) {
        return auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtAsc(TARGET_REPORT, reportId);
    }
}
