package com.medivet.helpanimal.service;

import java.time.Clock;
import java.time.Instant;

import com.medivet.helpanimal.domain.MissionAssignment;
import com.medivet.helpanimal.domain.Report;
import com.medivet.helpanimal.domain.ReportStateMachine;
import com.medivet.helpanimal.domain.ReportStatus;
import com.medivet.helpanimal.domain.ReportStatusHistory;
import com.medivet.helpanimal.exception.MissionAlreadyAssignedException;
import com.medivet.helpanimal.exception.MissionRejectedException;
import com.medivet.helpanimal.exception.NotFoundException;
import com.medivet.helpanimal.grpc.AssignmentResult;
import com.medivet.helpanimal.grpc.RescueCoordinationClient;
import com.medivet.helpanimal.repository.MissionAssignmentRepository;
import com.medivet.helpanimal.repository.ReportRepository;
import com.medivet.helpanimal.repository.ReportStatusHistoryRepository;
import com.medivet.helpanimal.security.CurrentUser;
import com.medivet.helpanimal.web.dto.ReportDetailResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * US23 : un intervenant accepte une mission de sauvetage.
 * <ol>
 *   <li>Le signalement doit etre Qualifie (RM03).</li>
 *   <li>Appel gRPC a RescueCoordination (RM13 : timeout 3 s, 2 reprises, circuit breaker).
 *       Pas de transaction ouverte pendant l'appel reseau.</li>
 *   <li>Passage a Attribue seulement apres confirmation, avec verrou optimiste (RM04).</li>
 * </ol>
 * Si RescueCoordination est indisponible, le signalement reste Qualifie (503).
 */
@Service
public class AcceptMissionService {

    private final ReportRepository reportRepository;
    private final ReportStatusHistoryRepository historyRepository;
    private final MissionAssignmentRepository missionRepository;
    private final ReportStateMachine stateMachine;
    private final RescueCoordinationClient rescueClient;
    private final ReportMapper mapper;
    private final TransactionTemplate transactionTemplate;
    private final Clock clock;

    public AcceptMissionService(ReportRepository reportRepository,
                                ReportStatusHistoryRepository historyRepository,
                                MissionAssignmentRepository missionRepository,
                                ReportStateMachine stateMachine,
                                RescueCoordinationClient rescueClient,
                                ReportMapper mapper,
                                PlatformTransactionManager transactionManager,
                                Clock clock) {
        this.reportRepository = reportRepository;
        this.historyRepository = historyRepository;
        this.missionRepository = missionRepository;
        this.stateMachine = stateMachine;
        this.rescueClient = rescueClient;
        this.mapper = mapper;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.clock = clock;
    }

    public ReportDetailResponse accept(Long reportId, CurrentUser intervenant) {
        Report report = reportRepository.findById(reportId)
            .filter(r -> r.getStatus() != ReportStatus.MASQUE)
            .orElseThrow(() -> new NotFoundException("Signalement " + reportId + " introuvable"));

        if (report.getStatus() == ReportStatus.ATTRIBUE
            || report.getStatus() == ReportStatus.EN_COURS
            || report.getStatus() == ReportStatus.TERMINE) {
            throw new MissionAlreadyAssignedException();
        }
        // Nouveau -> Attribue est interdit : il faut d'abord qualifier (409)
        stateMachine.check(report.getStatus(), ReportStatus.ATTRIBUE);
        long expectedVersion = report.getVersion();

        AssignmentResult result = rescueClient.assignMission(
            report.getId(), intervenant.id(), report.getLatitude(), report.getLongitude(), report.getSeverity());

        switch (result.outcome()) {
            case ALREADY_ASSIGNED -> throw new MissionAlreadyAssignedException();
            case REJECTED -> throw new MissionRejectedException(
                "Affectation refusee par RescueCoordination : " + result.message());
            default -> {
                // ASSIGNED : on confirme en base
            }
        }

        try {
            return transactionTemplate.execute(status ->
                confirm(reportId, expectedVersion, intervenant, result.missionId()));
        } catch (ObjectOptimisticLockingFailureException | DataIntegrityViolationException e) {
            // RM04 : une autre acceptation a ete validee entre-temps
            throw new MissionAlreadyAssignedException();
        }
    }

    private ReportDetailResponse confirm(Long reportId, long expectedVersion, CurrentUser intervenant, String missionId) {
        Report report = reportRepository.findById(reportId)
            .orElseThrow(() -> new NotFoundException("Signalement " + reportId + " introuvable"));
        if (report.getVersion() != expectedVersion || report.getStatus() != ReportStatus.QUALIFIE) {
            throw new MissionAlreadyAssignedException();
        }

        Instant now = clock.instant();
        ReportStatusHistory history = stateMachine.transition(
            report, ReportStatus.ATTRIBUE, intervenant.id(), "Mission acceptee (" + missionId + ")", now);
        report.assignTo(intervenant.id(), now);
        reportRepository.saveAndFlush(report);

        historyRepository.save(history);
        missionRepository.saveAndFlush(new MissionAssignment(reportId, missionId, intervenant.id(), now));

        return mapper.toFullDetail(report, historyRepository.findByReportIdOrderByChangedAtAscIdAsc(reportId));
    }
}
