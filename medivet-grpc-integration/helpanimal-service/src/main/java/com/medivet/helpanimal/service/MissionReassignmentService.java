package com.medivet.helpanimal.service;

import java.time.Clock;
import java.time.Instant;

import com.medivet.helpanimal.dto.ReportDetailResponse;
import com.medivet.helpanimal.exception.ForbiddenActionException;
import com.medivet.helpanimal.exception.InvalidTransitionException;
import com.medivet.helpanimal.exception.NotFoundException;
import com.medivet.helpanimal.grpc.RescueCoordinationClient;
import com.medivet.helpanimal.model.Report;
import com.medivet.helpanimal.model.ReportStateMachine;
import com.medivet.helpanimal.model.ReportStatus;
import com.medivet.helpanimal.model.ReportStatusHistory;
import com.medivet.helpanimal.repository.MissionAssignmentRepository;
import com.medivet.helpanimal.repository.ReportRepository;
import com.medivet.helpanimal.repository.ReportStatusHistoryRepository;
import com.medivet.helpanimal.security.CurrentUser;
import com.medivet.rescue.grpc.MissionReply;
import com.medivet.rescue.grpc.MissionStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * US46 / RM05 cote HelpAnimal : quand une mission repart en diffusion (desistement, 15 min sans
 * reponse) ou passe en escalade, le signalement Attribue redevient Qualifie et l'intervenant
 * n'est plus attribue. L'escalade est journalisee pour l'administrateur (RM15).
 */
@Service
public class MissionReassignmentService {

    /** Acteur de l'historique quand la decision vient de RescueCoordination. */
    static final long SYSTEM_ACTOR = 0L;

    private final ReportRepository reportRepository;
    private final ReportStatusHistoryRepository historyRepository;
    private final MissionAssignmentRepository missionRepository;
    private final ReportStateMachine stateMachine;
    private final RescueCoordinationClient client;
    private final AuditService auditService;
    private final ReportMapper mapper;
    private final TransactionTemplate transactions;
    private final Clock clock;

    public MissionReassignmentService(ReportRepository reportRepository,
                                      ReportStatusHistoryRepository historyRepository,
                                      MissionAssignmentRepository missionRepository,
                                      ReportStateMachine stateMachine,
                                      RescueCoordinationClient client,
                                      AuditService auditService,
                                      ReportMapper mapper,
                                      PlatformTransactionManager transactionManager,
                                      Clock clock) {
        this.reportRepository = reportRepository;
        this.historyRepository = historyRepository;
        this.missionRepository = missionRepository;
        this.stateMachine = stateMachine;
        this.client = client;
        this.auditService = auditService;
        this.mapper = mapper;
        this.transactions = new TransactionTemplate(transactionManager);
        this.clock = clock;
    }

    /** US46 : l'intervenant attribue se desiste ; la decision est prise par RescueCoordination. */
    public ReportDetailResponse decline(Long reportId, String reason, CurrentUser intervenant) {
        Report report = reportRepository.findById(reportId)
            .filter(r -> r.getStatus() != ReportStatus.MASQUE)
            .orElseThrow(() -> new NotFoundException("Signalement " + reportId + " introuvable"));
        if (report.getStatus() != ReportStatus.ATTRIBUE) {
            throw new InvalidTransitionException("Desistement possible seulement pour une mission attribuee et non demarree");
        }
        if (!intervenant.id().equals(report.getAssigneeId())) {
            throw new ForbiddenActionException("Seul l'intervenant attribue peut se desister");
        }

        // Pas de transaction ouverte pendant l'appel reseau (RM13)
        MissionReply reply = client.declineMission(reportId, intervenant.id(), reason);
        boolean escalated = reply.getStatus() == MissionStatus.MISSION_ESCALATED;
        String motive = reason == null || reason.isBlank() ? "sans motif" : reason.trim();
        release(reportId, escalated, "Desistement (" + motive + ") : " + reply.getMessage(), intervenant.id());

        return transactions.execute(status -> {
            Report updated = reportRepository.findById(reportId).orElseThrow();
            return mapper.toFullDetail(updated, historyRepository.findByReportIdOrderByChangedAtAscIdAsc(reportId));
        });
    }

    /**
     * Applique une reattribution ou une escalade decidee par RescueCoordination.
     * Idempotent : la reponse au desistement et l'evenement du flux arrivent presque en meme temps,
     * sur deux fils differents. Le premier remet le signalement en Qualifie ; le second voit soit
     * l'etat deja a jour, soit un conflit de version (verrou optimiste) qu'il ignore.
     */
    public void release(Long reportId, boolean escalated, String message, Long actorId) {
        for (int attempt = 1; ; attempt++) {
            try {
                applyRelease(reportId, escalated, message, actorId);
                return;
            } catch (ObjectOptimisticLockingFailureException e) {
                boolean stillAssigned = transactions.execute(status -> reportRepository.findById(reportId)
                    .map(report -> report.getStatus() == ReportStatus.ATTRIBUE).orElse(false));
                if (!stillAssigned) {
                    return; // l'autre chemin a deja applique la reattribution
                }
                if (attempt == 2) {
                    throw e;
                }
            }
        }
    }

    private void applyRelease(Long reportId, boolean escalated, String message, Long actorId) {
        transactions.executeWithoutResult(status -> reportRepository.findById(reportId)
            .filter(report -> report.getStatus() == ReportStatus.ATTRIBUE)
            .ifPresent(report -> {
                Instant now = clock.instant();
                long actor = actorId == null ? SYSTEM_ACTOR : actorId;
                ReportStatusHistory history = stateMachine.transition(report, ReportStatus.QUALIFIE, actor,
                    (escalated ? "Escalade vers l'administrateur (RM05) : " : "Mission reattribuee (RM05) : ") + message, now);
                report.releaseAssignment(now);
                reportRepository.saveAndFlush(report);
                historyRepository.save(history);
                missionRepository.findByReportId(reportId).ifPresent(missionRepository::delete);
                if (escalated) {
                    auditService.log(AuditService.ACTION_MISSION_ESCALATED, AuditService.TARGET_REPORT,
                        reportId, actor, message);
                }
            }));
    }
}
