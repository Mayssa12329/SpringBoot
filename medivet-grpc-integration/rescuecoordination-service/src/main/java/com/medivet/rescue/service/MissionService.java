package com.medivet.rescue.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Objects;

import com.medivet.rescue.config.RescueProperties;
import com.medivet.rescue.model.Mission;
import com.medivet.rescue.model.MissionEvent;
import com.medivet.rescue.model.MissionEventType;
import com.medivet.rescue.model.MissionStatus;
import com.medivet.rescue.repository.MissionEventRepository;
import com.medivet.rescue.repository.MissionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Regles de RescueCoordination.
 * <ul>
 *   <li>RM04 : une mission n'a qu'un intervenant ; en cas d'acceptations concurrentes, la premiere validee gagne
 *       (verrou optimiste sur la version de la mission).</li>
 *   <li>RM05 : apres un desistement ou 15 min sans reponse, la mission est rediffusee ; au-dela de
 *       3 reattributions, elle passe en escalade vers l'administrateur.</li>
 * </ul>
 * Chaque evenement est conserve dans l'historique et diffuse en streaming apres la validation en base.
 */
@Service
public class MissionService {

    private static final Logger log = LoggerFactory.getLogger(MissionService.class);

    private final MissionRepository missionRepository;
    private final MissionEventRepository eventRepository;
    private final ApplicationEventPublisher publisher;
    private final TransactionTemplate transactions;
    private final RescueProperties.Reassignment reassignment;
    private final Clock clock;

    public MissionService(MissionRepository missionRepository,
                          MissionEventRepository eventRepository,
                          ApplicationEventPublisher publisher,
                          PlatformTransactionManager transactionManager,
                          RescueProperties properties,
                          Clock clock) {
        this.missionRepository = missionRepository;
        this.eventRepository = eventRepository;
        this.publisher = publisher;
        this.transactions = new TransactionTemplate(transactionManager);
        this.reassignment = properties.reassignment();
        this.clock = clock;
    }

    public enum AssignResult { ASSIGNED, ALREADY_ASSIGNED, REJECTED }

    public record AssignOutcome(AssignResult result, String missionId, String message) { }

    /** SC2 etape 2 : le signalement qualifie devient une mission ouverte (idempotent). */
    public Mission publish(Long reportId, double latitude, double longitude, int severity, String species) {
        try {
            return transactions.execute(status -> missionRepository.findByReportId(reportId)
                .orElseGet(() -> create(reportId, latitude, longitude, severity, species)));
        } catch (DataIntegrityViolationException e) {
            // Deux publications simultanees : la mission existe deja
            return missionRepository.findByReportId(reportId).orElseThrow(() -> e);
        }
    }

    /**
     * US23 / RM04. Idempotent pour un meme intervenant : une reprise apres un delai depasse
     * (RM13 cote HelpAnimal) ne doit pas transformer une acceptation reussie en refus.
     */
    public AssignOutcome assign(Long reportId, Long intervenantId, double latitude, double longitude, int severity) {
        try {
            return transactions.execute(status -> doAssign(reportId, intervenantId, latitude, longitude, severity));
        } catch (ObjectOptimisticLockingFailureException | DataIntegrityViolationException e) {
            // RM04 : une autre acceptation a ete validee entre-temps
            return missionRepository.findByReportId(reportId)
                .filter(mission -> intervenantId.equals(mission.getIntervenantId()))
                .map(mission -> new AssignOutcome(AssignResult.ASSIGNED, mission.getMissionId(), "Mission attribuee"))
                .orElseGet(() -> new AssignOutcome(AssignResult.ALREADY_ASSIGNED, null, "Mission deja attribuee"));
        }
    }

    private AssignOutcome doAssign(Long reportId, Long intervenantId, double latitude, double longitude, int severity) {
        // Si HelpAnimal n'a pas pu publier la mission (mode degrade), elle est creee ici
        Mission mission = missionRepository.findByReportId(reportId)
            .orElseGet(() -> create(reportId, latitude, longitude, severity, null));

        switch (mission.getStatus()) {
            case OPEN -> {
                mission.assignTo(intervenantId, clock.instant());
                missionRepository.saveAndFlush(mission);
                record(mission, MissionEventType.ASSIGNED, intervenantId, "Mission acceptee par l'intervenant " + intervenantId);
                return new AssignOutcome(AssignResult.ASSIGNED, mission.getMissionId(), "Mission attribuee");
            }
            case ASSIGNED, IN_PROGRESS -> {
                if (intervenantId.equals(mission.getIntervenantId())) {
                    return new AssignOutcome(AssignResult.ASSIGNED, mission.getMissionId(), "Mission deja attribuee a cet intervenant");
                }
                return new AssignOutcome(AssignResult.ALREADY_ASSIGNED, null, "Mission deja attribuee");
            }
            case COMPLETED -> {
                return new AssignOutcome(AssignResult.REJECTED, null, "Mission terminee");
            }
            default -> {
                return new AssignOutcome(AssignResult.REJECTED, null,
                    "Mission en escalade : l'administrateur doit la reprendre (RM05)");
            }
        }
    }

    public Mission find(Long reportId) {
        return missionRepository.findByReportId(reportId).orElseThrow(() -> new MissionNotFoundException(reportId));
    }

    /** Missions ouvertes, les plus anciennes d'abord : proposees a l'intervenant qui se connecte. */
    public List<Mission> openMissions() {
        return missionRepository.findByStatusOrderByCreatedAtAsc(MissionStatus.OPEN);
    }

    /** US46 / RM05 : desistement de l'intervenant attribue. */
    public Mission decline(Long reportId, Long intervenantId, String reason) {
        return transactions.execute(status -> {
            Mission mission = missionRepository.findByReportId(reportId)
                .orElseThrow(() -> new MissionNotFoundException(reportId));
            if (mission.getStatus() != MissionStatus.ASSIGNED || !intervenantId.equals(mission.getIntervenantId())) {
                throw new MissionStateException("Seul l'intervenant attribue peut se desister avant le debut de l'intervention");
            }
            String motive = reason == null || reason.isBlank() ? "sans motif" : reason.trim();
            record(mission, MissionEventType.DECLINED, intervenantId, "Desistement : " + motive);
            release(mission, "apres desistement de l'intervenant " + intervenantId);
            return mission;
        });
    }

    /** US47 : HelpAnimal transmet le debut et la fin de l'intervention. */
    public Mission updateStatus(Long reportId, Long intervenantId, MissionStatus target) {
        if (target != MissionStatus.IN_PROGRESS && target != MissionStatus.COMPLETED) {
            throw new IllegalArgumentException("Statut transmissible : IN_PROGRESS ou COMPLETED");
        }
        return transactions.execute(status -> {
            Mission mission = missionRepository.findByReportId(reportId)
                .orElseThrow(() -> new MissionNotFoundException(reportId));
            if (mission.getStatus() == target) {
                return mission; // deja a jour (reprise)
            }
            MissionStatus expected = target == MissionStatus.IN_PROGRESS ? MissionStatus.ASSIGNED : MissionStatus.IN_PROGRESS;
            if (mission.getStatus() != expected) {
                throw new MissionStateException("Transition impossible : " + mission.getStatus() + " -> " + target);
            }
            if (intervenantId != null && !Objects.equals(intervenantId, mission.getIntervenantId())) {
                throw new MissionStateException("Seul l'intervenant attribue fait avancer la mission");
            }
            mission.moveTo(target, clock.instant());
            missionRepository.saveAndFlush(mission);
            MissionEventType type = target == MissionStatus.IN_PROGRESS ? MissionEventType.IN_PROGRESS : MissionEventType.COMPLETED;
            record(mission, type, mission.getIntervenantId(),
                target == MissionStatus.IN_PROGRESS ? "Intervention demarree" : "Sauvetage termine");
            return mission;
        });
    }

    /** RM05 : missions attribuees sans reponse depuis le delai configure (15 min). */
    @Scheduled(fixedDelayString = "${rescue.reassignment.check-interval-ms:60000}",
               initialDelayString = "${rescue.reassignment.check-interval-ms:60000}")
    public void reassignUnanswered() {
        Instant limit = clock.instant().minus(Duration.ofMinutes(reassignment.timeoutMinutes()));
        for (Mission stale : missionRepository.findByStatusAndAssignedAtBefore(MissionStatus.ASSIGNED, limit)) {
            try {
                transactions.executeWithoutResult(status -> missionRepository.findById(stale.getId())
                    .filter(mission -> mission.getStatus() == MissionStatus.ASSIGNED)
                    .ifPresent(mission -> release(mission, "sans reponse de l'intervenant " + mission.getIntervenantId()
                        + " depuis " + reassignment.timeoutMinutes() + " min")));
            } catch (ObjectOptimisticLockingFailureException e) {
                log.info("Mission {} modifiee pendant la verification RM05, ignoree", stale.getMissionId());
            }
        }
    }

    private void release(Mission mission, String cause) {
        mission.release(reassignment.maxReassignments(), clock.instant());
        missionRepository.saveAndFlush(mission);
        if (mission.getStatus() == MissionStatus.ESCALATED) {
            record(mission, MissionEventType.ESCALATED, null, "Escalade vers l'administrateur " + cause
                + " (" + mission.getReassignments() + " reattributions)");
        } else {
            record(mission, MissionEventType.REASSIGNED, null, "Mission rediffusee " + cause
                + " (reattribution " + mission.getReassignments() + "/" + reassignment.maxReassignments() + ")");
        }
    }

    private Mission create(Long reportId, double latitude, double longitude, int severity, String species) {
        Mission mission = missionRepository.saveAndFlush(
            new Mission(reportId, latitude, longitude, severity, species, clock.instant()));
        record(mission, MissionEventType.PUBLISHED, null, "Mission diffusee aux intervenants");
        return mission;
    }

    private void record(Mission mission, MissionEventType type, Long intervenantId, String message) {
        Instant now = clock.instant();
        eventRepository.save(new MissionEvent(mission.getId(), type, intervenantId, message, now));
        publisher.publishEvent(MissionNotification.of(mission, type, intervenantId, message, now));
        log.info("Mission {} : {} ({})", mission.getMissionId(), type, message);
    }
}
