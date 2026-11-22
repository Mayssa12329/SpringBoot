package com.medivet.helpanimal.service;

import com.medivet.helpanimal.repository.ReportRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Enregistre l'animal secouru dans PetPass une fois le passage a Termine valide en base.
 * Asynchrone : l'intervenant n'attend pas PetPass, et une panne de PetPass n'annule rien.
 */
@Component
public class PetPassCareFileListener {

    private final ReportRepository reportRepository;
    private final PetPassClient petPassClient;

    public PetPassCareFileListener(ReportRepository reportRepository, PetPassClient petPassClient) {
        this.reportRepository = reportRepository;
        this.petPassClient = petPassClient;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onRescueCompleted(RescueCompletedEvent event) {
        reportRepository.findById(event.reportId())
            .filter(report -> report.getAssigneeId() != null && report.getPetpassAnimalId() == null)
            .ifPresent(report -> petPassClient.registerRescuedAnimal(report)
                .ifPresent(animalId -> reportRepository.linkPetPassAnimal(report.getId(), animalId)));
    }
}
