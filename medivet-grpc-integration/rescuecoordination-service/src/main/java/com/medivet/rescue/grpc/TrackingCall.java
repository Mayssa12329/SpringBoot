package com.medivet.rescue.grpc;

import java.time.Clock;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

import com.medivet.rescue.service.TrackingService;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;

/**
 * Client streaming TrackMission : un appel = un trajet. Les positions arrivent une par une
 * (gRPC appelle onNext dans l'ordre, jamais en parallele pour un meme appel) ; le bilan est
 * envoye une seule fois, quand l'intervenant ferme son flux.
 * A la premiere erreur, l'appel se termine et les positions suivantes sont ignorees.
 */
final class TrackingCall implements StreamObserver<PositionUpdate> {

    private final TrackingService tracking;
    private final Clock clock;
    private final StreamObserver<TrackingSummary> response;
    private final List<TrackingService.TrackPoint> points = new ArrayList<>();
    private Long reportId;
    private Long intervenantId;
    private boolean finished;

    TrackingCall(TrackingService tracking, Clock clock, StreamObserver<TrackingSummary> response) {
        this.tracking = tracking;
        this.clock = clock;
        this.response = response;
    }

    @Override
    public void onNext(PositionUpdate update) {
        if (finished) {
            return;
        }
        try {
            Long report = RescueCoordinationGrpcService.id(update.getReportId(), "report_id");
            Long intervenant = RescueCoordinationGrpcService.id(update.getIntervenantId(), "intervenant_id");
            if (reportId == null) {
                // Refus immediat, sans attendre la fin du trajet
                tracking.checkTrackable(report, intervenant);
                reportId = report;
                intervenantId = intervenant;
            } else if (!report.equals(reportId) || !intervenant.equals(intervenantId)) {
                throw new IllegalArgumentException("Un flux de suivi concerne une seule mission et un seul intervenant");
            }
            if (points.size() >= TrackingService.MAX_POINTS) {
                fail(Status.RESOURCE_EXHAUSTED.withDescription(
                    "Plus de " + TrackingService.MAX_POINTS + " positions dans un meme flux"));
                return;
            }
            points.add(new TrackingService.TrackPoint(update.getLatitude(), update.getLongitude(),
                recordedAt(update.getRecordedAt())));
        } catch (RuntimeException e) {
            fail(RescueCoordinationGrpcService.statusOf(e));
        }
    }

    @Override
    public void onError(Throwable error) {
        // L'intervenant a annule son flux : rien n'est enregistre
        finished = true;
    }

    @Override
    public void onCompleted() {
        if (finished) {
            return;
        }
        try {
            TrackingService.Summary summary = tracking.save(reportId, intervenantId, points);
            finished = true;
            response.onNext(TrackingSummary.newBuilder()
                .setMissionId(summary.missionId())
                .setPoints(summary.points())
                .setDistanceKm(summary.distanceKm())
                .setDurationSeconds(summary.durationSeconds())
                .setRemainingKm(summary.remainingKm())
                .setArrived(summary.arrived())
                .build());
            response.onCompleted();
        } catch (RuntimeException e) {
            fail(RescueCoordinationGrpcService.statusOf(e));
        }
    }

    private Instant recordedAt(String value) {
        if (value.isBlank()) {
            return clock.instant();
        }
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("recorded_at doit etre une date ISO-8601");
        }
    }

    private void fail(Status status) {
        finished = true;
        response.onError(status.asRuntimeException());
    }
}
