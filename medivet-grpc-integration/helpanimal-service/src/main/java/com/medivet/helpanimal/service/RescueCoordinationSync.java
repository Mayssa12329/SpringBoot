package com.medivet.helpanimal.service;

import com.medivet.helpanimal.grpc.RescueCoordinationClient;
import com.medivet.helpanimal.repository.ReportRepository;
import com.medivet.rescue.grpc.MissionStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Tient RescueCoordination informe des changements d'etat, apres leur validation en base :
 * Qualifie -> mission diffusee, En cours / Termine -> suivi de la mission.
 * Asynchrone et en mode degrade (RM13) : une panne de RescueCoordination n'annule rien cote
 * HelpAnimal. Une mission non diffusee est creee au moment de l'acceptation.
 */
@Component
public class RescueCoordinationSync {

    private static final Logger log = LoggerFactory.getLogger(RescueCoordinationSync.class);

    private final ReportRepository reportRepository;
    private final RescueCoordinationClient client;

    public RescueCoordinationSync(ReportRepository reportRepository, RescueCoordinationClient client) {
        this.reportRepository = reportRepository;
        this.client = client;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onStatusChanged(MissionSyncEvent event) {
        reportRepository.findById(event.reportId()).ifPresent(report -> {
            try {
                switch (event.status()) {
                    case QUALIFIE -> client.publishMission(report);
                    case EN_COURS -> client.updateMissionStatus(report.getId(), report.getAssigneeId(),
                        MissionStatus.MISSION_IN_PROGRESS);
                    case TERMINE -> client.updateMissionStatus(report.getId(), report.getAssigneeId(),
                        MissionStatus.MISSION_COMPLETED);
                    default -> {
                        // Rejete : aucune mission a informer
                    }
                }
            } catch (RuntimeException e) {
                log.warn("RescueCoordination non informe du passage du signalement {} a {} : {}",
                    report.getId(), event.status(), e.getMessage());
            }
        });
    }
}
