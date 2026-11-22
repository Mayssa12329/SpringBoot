package com.medivet.rescue.model;

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

/** Mission de sauvetage, creee a partir d'un signalement HelpAnimal (une mission par signalement). */
@Entity
@Table(name = "mission")
public class Mission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mission_id", nullable = false, unique = true, length = 40)
    private String missionId;

    @Column(name = "report_id", nullable = false, unique = true)
    private Long reportId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MissionStatus status;

    @Column(name = "intervenant_id")
    private Long intervenantId;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(nullable = false)
    private int severity;

    @Column(length = 50)
    private String species;

    @Column(nullable = false)
    private int reassignments;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "assigned_at")
    private Instant assignedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** RM04 : deux acceptations simultanees -> une seule validee. */
    @Version
    @Column(nullable = false)
    private Long version;

    protected Mission() {
        // requis par JPA
    }

    public Mission(Long reportId, double latitude, double longitude, int severity, String species, Instant now) {
        this.missionId = "MIS-" + reportId;
        this.reportId = reportId;
        this.status = MissionStatus.OPEN;
        this.latitude = latitude;
        this.longitude = longitude;
        this.severity = severity;
        this.species = species;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void assignTo(Long intervenantId, Instant now) {
        this.status = MissionStatus.ASSIGNED;
        this.intervenantId = intervenantId;
        this.assignedAt = now;
        this.updatedAt = now;
    }

    /** RM05 : la mission repart en diffusion, ou passe en escalade au-dela du maximum. */
    public void release(int maxReassignments, Instant now) {
        this.reassignments++;
        this.status = reassignments > maxReassignments ? MissionStatus.ESCALATED : MissionStatus.OPEN;
        this.intervenantId = null;
        this.assignedAt = null;
        this.updatedAt = now;
    }

    public void moveTo(MissionStatus status, Instant now) {
        this.status = status;
        this.updatedAt = now;
    }

    public Long getId() {
        return id;
    }

    public String getMissionId() {
        return missionId;
    }

    public Long getReportId() {
        return reportId;
    }

    public MissionStatus getStatus() {
        return status;
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

    public int getSeverity() {
        return severity;
    }

    public String getSpecies() {
        return species;
    }

    public int getReassignments() {
        return reassignments;
    }

    public Instant getAssignedAt() {
        return assignedAt;
    }

    public Long getVersion() {
        return version;
    }
}
