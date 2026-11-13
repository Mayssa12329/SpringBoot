package com.medivet.helpanimal.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

/** Signalement d'un animal en detresse (US19, US20). */
@Entity
@Table(name = "report")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String species;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReportCategory category;

    @Column(nullable = false, length = 2000)
    private String description;

    /** Gravite declaree, de 1 (faible) a 5 (urgence vitale). */
    @Column(nullable = false)
    private int severity;

    @Column(name = "photo_url", nullable = false, length = 500)
    private String photoUrl;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReportStatus status;

    @Column(name = "reporter_id", nullable = false)
    private Long reporterId;

    /** Intervenant qui a accepte la mission (US23). */
    @Column(name = "assignee_id")
    private Long assigneeId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Date de prise en charge (passage a Attribue). */
    @Column(name = "taken_charge_at")
    private Instant takenChargeAt;

    /** Verrou optimiste : deux acceptations simultanees -> une seule gagne (RM04). */
    @Version
    @Column(nullable = false)
    private Long version;

    protected Report() {
        // requis par JPA
    }

    public Report(String species, ReportCategory category, String description, int severity,
                  String photoUrl, double latitude, double longitude, Long reporterId, Instant now) {
        this.species = species;
        this.category = category;
        this.description = description;
        this.severity = severity;
        this.photoUrl = photoUrl;
        this.latitude = latitude;
        this.longitude = longitude;
        this.reporterId = reporterId;
        this.status = ReportStatus.NOUVEAU;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void moveTo(double latitude, double longitude, Instant now) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.updatedAt = now;
    }

    public void assignTo(Long intervenantId, Instant now) {
        this.assigneeId = intervenantId;
        this.takenChargeAt = now;
        this.updatedAt = now;
    }

    /** Appele uniquement par ReportStateMachine, qui verifie la transition. */
    void setStatus(ReportStatus status, Instant now) {
        this.status = status;
        this.updatedAt = now;
    }

    public boolean isTakenInCharge() {
        return assigneeId != null;
    }

    public Long getId() {
        return id;
    }

    public String getSpecies() {
        return species;
    }

    public ReportCategory getCategory() {
        return category;
    }

    public String getDescription() {
        return description;
    }

    public int getSeverity() {
        return severity;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public ReportStatus getStatus() {
        return status;
    }

    public Long getReporterId() {
        return reporterId;
    }

    public Long getAssigneeId() {
        return assigneeId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Instant getTakenChargeAt() {
        return takenChargeAt;
    }

    public Long getVersion() {
        return version;
    }
}
