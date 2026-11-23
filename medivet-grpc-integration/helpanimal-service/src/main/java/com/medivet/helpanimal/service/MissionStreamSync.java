package com.medivet.helpanimal.service;

import java.time.Clock;
import java.time.Instant;
import java.util.function.Predicate;

import com.medivet.helpanimal.model.MissionAssignment;
import com.medivet.helpanimal.model.Report;
import com.medivet.helpanimal.model.ReportStateMachine;
import com.medivet.helpanimal.model.ReportStatus;
import com.medivet.helpanimal.repository.MissionAssignmentRepository;
import com.medivet.helpanimal.repository.ReportRepository;
import com.medivet.helpanimal.repository.ReportStatusHistoryRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Applique a HelpAnimal les decisions prises directement par RescueCoordination, recues par le flux
 * WatchMissions : un intervenant peut accepter ou demarrer une mission depuis son canal de dispatch
 * (gRPC bidirectionnel) sans passer par l'API REST de HelpAnimal.
 * Idempotent : quand l'action vient de l'API REST, l'evenement arrive aussi par le flux et ne change rien.
 */
@Service
public class MissionStreamSync {

    private final ReportRepository reportRepository;
    private final ReportStatusHistoryRepository historyRepository;
    private final MissionAssignmentRepository missionRepository;
    private final ReportStateMachine stateMachine;
    private final TransactionTemplate transactions;
    private final Clock clock;

    public MissionStreamSync(ReportRepository reportRepository,
                             ReportStatusHistoryRepository historyRepository,
                             MissionAssignmentRepository missionRepository,
                             ReportStateMachine stateMachine,
                             PlatformTransactionManager transactionManager,
                             Clock clock) {
        this.reportRepository = reportRepository;
        this.historyRepository = historyRepository;
        this.missionRepository = missionRepository;
        this.stateMachine = stateMachine;
        this.transactions = new TransactionTemplate(transactionManager);
        this.clock = clock;
    }

    /** US23 : mission attribuee par RescueCoordination -> signalement Qualifie devient Attribue. */
    public void assigned(Long reportId, Long intervenantId, String missionId) {
        applyOnce(reportId, report -> report.getStatus() != ReportStatus.QUALIFIE, () ->
            transactions.executeWithoutResult(status -> reportRepository.findById(reportId)
                .filter(report -> report.getStatus() == ReportStatus.QUALIFIE)
                .ifPresent(report -> {
                    Instant now = clock.instant();
                    // Meme commentaire que l'acceptation par l'API REST : l'historique ne depend pas du chemin
                    var history = stateMachine.transition(report, ReportStatus.ATTRIBUE, intervenantId,
                        "Mission acceptee (" + missionId + ")", now);
                    report.assignTo(intervenantId, now);
                    reportRepository.saveAndFlush(report);
                    historyRepository.save(history);
                    missionRepository.saveAndFlush(new MissionAssignment(reportId, missionId, intervenantId, now));
                })));
    }

    /** US47 : intervention demarree depuis le dispatch -> Attribue devient En cours. */
    public void started(Long reportId, Long intervenantId) {
        applyOnce(reportId, report -> report.getStatus() != ReportStatus.ATTRIBUE, () ->
            transactions.executeWithoutResult(status -> reportRepository.findById(reportId)
                .filter(report -> report.getStatus() == ReportStatus.ATTRIBUE)
                .filter(report -> intervenantId.equals(report.getAssigneeId()))
                .ifPresent(report -> {
                    var history = stateMachine.transition(report, ReportStatus.EN_COURS, intervenantId,
                        "Intervention demarree", clock.instant());
                    reportRepository.saveAndFlush(report);
                    historyRepository.save(history);
                })));
    }

    /**
     * Le meme changement peut arriver en parallele par l'API REST : en cas de conflit (verrou optimiste,
     * affectation deja enregistree), on relit le signalement ; s'il est deja a jour, rien a faire.
     */
    private void applyOnce(Long reportId, Predicate<Report> alreadyApplied, Runnable apply) {
        for (int attempt = 1; ; attempt++) {
            try {
                apply.run();
                return;
            } catch (ObjectOptimisticLockingFailureException | DataIntegrityViolationException e) {
                boolean done = Boolean.TRUE.equals(transactions.execute(status ->
                    reportRepository.findById(reportId).map(alreadyApplied::test).orElse(true)));
                if (done) {
                    return;
                }
                if (attempt == 2) {
                    throw e;
                }
            }
        }
    }
}
