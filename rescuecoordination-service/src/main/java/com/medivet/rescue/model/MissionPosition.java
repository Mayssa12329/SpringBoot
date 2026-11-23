package com.medivet.rescue.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Position GPS de l'intervenant pendant son trajet vers l'animal (TrackMission). */
@Entity
@Table(name = "mission_position")
public class MissionPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mission_id", nullable = false)
    private Long missionId;

    @Column(name = "intervenant_id", nullable = false)
    private Long intervenantId;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    protected MissionPosition() {
        // requis par JPA
    }

    public MissionPosition(Long missionId, Long intervenantId, double latitude, double longitude, Instant recordedAt) {
        this.missionId = missionId;
        this.intervenantId = intervenantId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.recordedAt = recordedAt;
    }

    public Long getMissionId() {
        return missionId;
    }

    public Long getIntervenantId() {
        return intervenantId;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public Instant getRecordedAt() {
        return recordedAt;
    }
}
