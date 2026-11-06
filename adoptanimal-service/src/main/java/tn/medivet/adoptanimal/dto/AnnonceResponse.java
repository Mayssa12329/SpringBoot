package tn.medivet.adoptanimal.dto;

import tn.medivet.adoptanimal.entity.Annonce;
import tn.medivet.adoptanimal.entity.StatutAnnonce;

import java.time.LocalDateTime;

public record AnnonceResponse(
        Long id, Long animalId, String puce, String nom, String espece, Integer ageEstime,
        String localisation, String description, String photoUrl, Long refugeId,
        StatutAnnonce statut, LocalDateTime createdAt) {

    public static AnnonceResponse from(Annonce a) {
        return new AnnonceResponse(a.getId(), a.getAnimalId(), a.getPuce(), a.getNom(), a.getEspece(),
                a.getAgeEstime(), a.getLocalisation(), a.getDescription(), a.getPhotoUrl(),
                a.getRefugeId(), a.getStatut(), a.getCreatedAt());
    }
}
