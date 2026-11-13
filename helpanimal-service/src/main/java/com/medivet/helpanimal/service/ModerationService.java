package com.medivet.helpanimal.service;

import java.time.Clock;
import java.util.List;

import com.medivet.helpanimal.domain.Report;
import com.medivet.helpanimal.domain.ReportStateMachine;
import com.medivet.helpanimal.domain.ReportStatus;
import com.medivet.helpanimal.domain.ReportStatusHistory;
import com.medivet.helpanimal.exception.InvalidTransitionException;
import com.medivet.helpanimal.repository.ReportStatusHistoryRepository;
import com.medivet.helpanimal.security.CurrentUser;
import com.medivet.helpanimal.web.dto.ReportDetailResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * US25 : moderation par l'administrateur.
 * Masquage motive, possible seulement avant l'attribution (RM03), journalise (RM15).
 */
@Service
public class ModerationService {

    private final ReportService reportService;
    private final ReportStatusHistoryRepository historyRepository;
    private final ReportStateMachine stateMachine;
    private final AuditService auditService;
    private final ReportMapper mapper;
    private final Clock clock;

    public ModerationService(ReportService reportService,
                             ReportStatusHistoryRepository historyRepository,
                             ReportStateMachine stateMachine,
                             AuditService auditService,
                             ReportMapper mapper,
                             Clock clock) {
        this.reportService = reportService;
        this.historyRepository = historyRepository;
        this.stateMachine = stateMachine;
        this.auditService = auditService;
        this.mapper = mapper;
        this.clock = clock;
    }

    @Transactional
    public ReportDetailResponse hide(Long reportId, String reason, CurrentUser admin) {
        Report report = reportService.findReport(reportId, admin);
        if (report.getStatus() == ReportStatus.MASQUE) {
            throw new InvalidTransitionException("Le signalement est deja masque");
        }
        String motive = reason.trim();
        ReportStatusHistory history = stateMachine.transition(
            report, ReportStatus.MASQUE, admin.id(), "Masque : " + motive, clock.instant());
        historyRepository.save(history);

        auditService.log(AuditService.ACTION_REPORT_HIDDEN, AuditService.TARGET_REPORT,
            report.getId(), admin.id(), motive);

        List<ReportStatusHistory> all = historyRepository.findByReportIdOrderByChangedAtAscIdAsc(reportId);
        return mapper.toFullDetail(report, all);
    }
}
