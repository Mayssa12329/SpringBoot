package com.medivet.rescue.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

import com.medivet.rescue.model.Mission;
import com.medivet.rescue.model.MissionPosition;
import com.medivet.rescue.model.MissionStatus;
import com.medivet.rescue.repository.MissionPositionRepository;
import com.medivet.rescue.repository.MissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Suivi GPS du trajet de l'intervenant (client streaming TrackMission).
 * Seul l'intervenant attribue d'une mission attribuee ou en cours peut envoyer des positions.
 * Les positions sont enregistrees en une seule transaction a la fin du flux, avec le bilan du trajet.
 */
@Service
public class TrackingService {

    /** Garde-fou : un flux ne peut pas envoyer plus de positions que cela. */
    public static final int MAX_POINTS = 10_000;

    /** En dessous de 100 m de l'animal, l'intervenant est considere arrive. */
    static final double ARRIVAL_KM = 0.1;

    private static final double EARTH_RADIUS_KM = 6371.0;

    private final MissionRepository missionRepository;
    private final MissionPositionRepository positionRepository;
    private final TransactionTemplate transactions;

    public TrackingService(MissionRepository missionRepository, MissionPositionRepository positionRepository,
                           PlatformTransactionManager transactionManager) {
        this.missionRepository = missionRepository;
        this.positionRepository = positionRepository;
        this.transactions = new TransactionTemplate(transactionManager);
    }

    public record TrackPoint(double latitude, double longitude, Instant recordedAt) {

        public TrackPoint {
            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                throw new IllegalArgumentException("Coordonnees GPS hors limites");
            }
        }
    }

    public record Summary(String missionId, int points, double distanceKm, long durationSeconds,
                          double remainingKm, boolean arrived) { }

    /** Verifie, des la premiere position, que l'intervenant peut suivre cette mission. */
    public Mission checkTrackable(Long reportId, Long intervenantId) {
        Mission mission = missionRepository.findByReportId(reportId)
            .orElseThrow(() -> new MissionNotFoundException(reportId));
        boolean active = mission.getStatus() == MissionStatus.ASSIGNED || mission.getStatus() == MissionStatus.IN_PROGRESS;
        if (!active || !intervenantId.equals(mission.getIntervenantId())) {
            throw new MissionStateException("Seul l'intervenant attribue d'une mission en cours peut envoyer sa position");
        }
        return mission;
    }

    /** Enregistre le trajet et calcule son bilan. La mission est reverifiee : elle a pu etre reattribuee entre-temps. */
    public Summary save(Long reportId, Long intervenantId, List<TrackPoint> received) {
        if (received.isEmpty()) {
            throw new IllegalArgumentException("Aucune position recue");
        }
        List<TrackPoint> points = received.stream().sorted(Comparator.comparing(TrackPoint::recordedAt)).toList();
        return transactions.execute(status -> {
            Mission mission = checkTrackable(reportId, intervenantId);
            positionRepository.saveAll(points.stream()
                .map(p -> new MissionPosition(mission.getId(), intervenantId, p.latitude(), p.longitude(), p.recordedAt()))
                .toList());

            double distance = 0;
            for (int i = 1; i < points.size(); i++) {
                distance += distanceKm(points.get(i - 1), points.get(i).latitude(), points.get(i).longitude());
            }
            TrackPoint last = points.get(points.size() - 1);
            double remaining = distanceKm(last, mission.getLatitude(), mission.getLongitude());
            long duration = Duration.between(points.get(0).recordedAt(), last.recordedAt()).toSeconds();
            return new Summary(mission.getMissionId(), points.size(), round(distance), duration, round(remaining),
                remaining <= ARRIVAL_KM);
        });
    }

    /** Distance a vol d'oiseau (formule de haversine). */
    static double distanceKm(TrackPoint from, double latitude, double longitude) {
        double dLat = Math.toRadians(latitude - from.latitude());
        double dLng = Math.toRadians(longitude - from.longitude());
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(from.latitude())) * Math.cos(Math.toRadians(latitude))
            * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
    }

    private static double round(double km) {
        return Math.round(km * 1000) / 1000.0;
    }
}
