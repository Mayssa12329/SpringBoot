package com.medivet.helpanimal.domain;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.Optional;

import com.medivet.helpanimal.config.HelpAnimalProperties;
import com.medivet.helpanimal.repository.ReportRepository;
import org.springframework.stereotype.Component;

/**
 * RM02 : un signalement proche d'un signalement actif de meme espece est rattache, pas duplique.
 * Parametres par defaut : rayon 100 m, fenetre 2 h.
 */
@Component
public class DuplicateDetector {

    private final ReportRepository reportRepository;
    private final Clock clock;
    private final double radiusMeters;
    private final Duration window;

    public DuplicateDetector(ReportRepository reportRepository, Clock clock, HelpAnimalProperties properties) {
        this.reportRepository = reportRepository;
        this.clock = clock;
        this.radiusMeters = properties.duplicate().radiusMeters();
        this.window = Duration.ofMinutes(properties.duplicate().windowMinutes());
    }

    /** Renvoie le signalement existant le plus proche s'il y a doublon. */
    public Optional<Report> findDuplicate(String species, double latitude, double longitude) {
        return findDuplicate(species, latitude, longitude, null);
    }

    /** Meme controle pour un signalement deplace : il ne peut pas etre son propre doublon. */
    public Optional<Report> findDuplicateOf(Report report, double latitude, double longitude) {
        return findDuplicate(report.getSpecies(), latitude, longitude, report.getId());
    }

    private Optional<Report> findDuplicate(String species, double latitude, double longitude, Long excludedId) {
        Instant since = clock.instant().minus(window);
        GeoUtils.BoundingBox box = GeoUtils.boundingBox(latitude, longitude, radiusMeters);

        return reportRepository
            .findBySpeciesAndStatusInAndCreatedAtAfterAndLatitudeBetweenAndLongitudeBetween(
                species, ReportStatus.ACTIVE, since,
                box.minLat(), box.maxLat(), box.minLng(), box.maxLng())
            .stream()
            .filter(r -> !r.getId().equals(excludedId))
            .filter(r -> distance(r, latitude, longitude) <= radiusMeters)
            .min(Comparator.comparingDouble(r -> distance(r, latitude, longitude)));
    }

    private static double distance(Report report, double latitude, double longitude) {
        return GeoUtils.distanceMeters(report.getLatitude(), report.getLongitude(), latitude, longitude);
    }
}
