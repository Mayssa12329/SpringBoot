package com.medivet.helpanimal.repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import com.medivet.helpanimal.model.Report;
import com.medivet.helpanimal.model.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface ReportRepository extends JpaRepository<Report, Long> {

    /** US21 : signalements a afficher sur la carte. */
    List<Report> findByStatusIn(Collection<ReportStatus> statuses);

    /** US22 : pre-filtre rectangulaire avant le calcul exact de distance. */
    List<Report> findByStatusInAndLatitudeBetweenAndLongitudeBetween(
        Collection<ReportStatus> statuses,
        double minLat, double maxLat,
        double minLng, double maxLng);

    /** RM02 : candidats au doublon (meme espece, actifs, recents, dans le rectangle). */
    List<Report> findBySpeciesAndStatusInAndCreatedAtAfterAndLatitudeBetweenAndLongitudeBetween(
        String species,
        Collection<ReportStatus> statuses,
        Instant since,
        double minLat, double maxLat,
        double minLng, double maxLng);

    /** Onglet "Mes signalements" : hors signalements masques, du plus recent au plus ancien. */
    List<Report> findByReporterIdAndStatusNotOrderByCreatedAtDescIdDesc(Long reporterId, ReportStatus excludedStatus);

    /** US25 : statut du signalement proprietaire d'une photo, sans charger l'entite. */
    @Query("select r.status from Report r where r.photoUrl = :photoUrl")
    Optional<ReportStatus> findStatusByPhotoUrl(@Param("photoUrl") String photoUrl);

    /** Lien PetPass : enregistre l'animal cree, sans toucher au verrou optimiste du sauvetage. */
    @Modifying
    @Transactional
    @Query("update Report r set r.petpassAnimalId = :animalId where r.id = :id and r.petpassAnimalId is null")
    int linkPetPassAnimal(@Param("id") Long id, @Param("animalId") Long animalId);
}
