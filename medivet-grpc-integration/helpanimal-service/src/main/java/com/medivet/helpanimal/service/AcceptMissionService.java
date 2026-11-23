package com.medivet.helpanimal.service;

import java.time.Clock;
import java.time.Instant;

import com.medivet.helpanimal.model.MissionAssignment;
import com.medivet.helpanimal.model.Report;
import com.medivet.helpanimal.model.ReportStateMachine;
import com.medivet.helpanimal.model.ReportStatus;
import com.medivet.helpanimal.model.ReportStatusHistory;
import com.medivet.helpanimal.exception.MissionAlreadyAssignedException;
import com.medivet.helpanimal.exception.MissionRejectedException;
import com.medivet.helpanimal.grpc.AssignmentResult;
import com.medivet.helpanimal.grpc.RescueCoordinationClient;
import com.medivet.helpanimal.exception.NotFoundException;
import com.medivet.helpanimal.repository.MissionAssignmentRepository;
import com.medivet.helpanimal.repository.ReportRepository;
import com.medivet.helpanimal.repository.ReportStatusHistoryRepository;
import com.medivet.helpanimal.security.CurrentUser;
import com.medivet.helpanimal.dto.ReportDetailResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * US23 : un intervenant accepte une mission de sauvetage.
 * <ol>
 *   <li>Le signalement doit etre Qualifie (RM03).</li>
 *   <li>Affectation demandee a RescueCoordinationService en gRPC (RM04 : la premiere acceptation
 *       validee gagne ; RM13 : 3 s, 2 reprises, circuit breaker). Pas de transaction ouverte pendant l'appel.</li>
 *   <li>Passage a Attribue seulement apres confirmation, avec verrou optimiste.</li>
 * </ol>
 * Si RescueCoordination est indisponible, le signalement reste Qualifie (503).
 */
@Service
public class AcceptMissionService {

    private final ReportRepository reportRepository;
    private final ReportStatusHistoryRepository historyRepository;
    private final MissionAssignmentRepository missionRepository;
    private final ReportStateMachine stateMachine;
    private final ReportMapper mapper;
    private final RescueCoordinationClient rescueClient;
    private final TransactionTemplate transactionTemplate;
    private final Clock clock;

    public AcceptMissionService(ReportRepository reportRepository,
                                ReportStatusHistoryRepository historyRepository,
                                MissionAssignmentRepository missionRepository,
                                ReportStateMachine stateMachine,
                                ReportMapper mapper,
                                RescueCoordinationClient rescueClient,
                                PlatformTransactionManager transactionManager,
                                Clock clock) {
        this.reportRepository = reportRepository;
        this.historyRepository = historyRepository;
        this.missionRepository = missionRepository;
        this.stateMachine = stateMachine;
        this.mapper = mapper;
        this.rescueClient = rescueClient;
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

        // US23 : affectation demandee a RescueCoordination (gRPC unaire)
        AssignmentResult result = rescueClient.assignMission(report.getId(), intervenant.id(),
            report.getLatitude(), report.getLongitude(), report.getSeverity());
        switch (result.outcome()) {
            case ALREADY_ASSIGNED -> throw new MissionAlreadyAssignedException();
            case REJECTED -> throw new MissionRejectedException(
                "Affectation refusee par RescueCoordination : " + result.message());
            default -> {
                // ASSIGNED : confirmation en base
            }
        }
        String missionId = result.missionId();

        try {
            return transactionTemplate.execute(status ->
                confirm(reportId, expectedVersion, intervenant, missionId));
        } catch (ObjectOptimisticLockingFailureException | DataIntegrityViolationException e) {
            // L'evenement du flux a pu enregistrer cette meme acceptation en parallele
            ReportDetailResponse mine = transactionTemplate.execute(status -> alreadyMine(reportId, intervenant));
            if (mine != null) {
                return mine;
            }
            // RM04 : une autre acceptation a ete validee entre-temps
            throw new MissionAlreadyAssignedException();
        }
    }

    /** Detail du signalement s'il est deja attribue a cet intervenant, sinon null. */
    private ReportDetailResponse alreadyMine(Long reportId, CurrentUser intervenant) {
        return reportRepository.findById(reportId)
            .filter(report -> report.getStatus() == ReportStatus.ATTRIBUE)
            .filter(report -> intervenant.id().equals(report.getAssigneeId()))
            .map(report -> mapper.toFullDetail(report, historyRepository.findByReportIdOrderByChangedAtAscIdAsc(reportId)))
            .orElse(null);
    }

    private ReportDetailResponse confirm(Long reportId, long expectedVersion, CurrentUser intervenant, String missionId) {
        ReportDetailResponse mine = alreadyMine(reportId, intervenant);
        if (mine != null) {
            return mine; // deja enregistree par l'evenement EVENT_ASSIGNED du flux
        }
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
