package com.medivet.helpanimal.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Trace de l'affectation confirmee par RescueCoordinationService (US23). */
@Entity
@Table(name = "mission_assignment")
public class MissionAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_id", nullable = false, unique = true)
    private Long reportId;

    @Column(name = "mission_id", nullable = false, length = 100)
    private String missionId;

    @Column(name = "intervenant_id", nullable = false)
    private Long intervenantId;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    protected MissionAssignment() {
        // requis par JPA
    }

    public MissionAssignment(Long reportId, String missionId, Long intervenantId, Instant assignedAt) {
        this.reportId = reportId;
        this.missionId = missionId;
        this.intervenantId = intervenantId;
        this.assignedAt = assignedAt;
    }

    public Long getId() {
        return id;
    }

    public Long getReportId() {
        return reportId;
    }

    public String getMissionId() {
        return missionId;
    }

    public Long getIntervenantId() {
        return intervenantId;
    }

    public Instant getAssignedAt() {
        return assignedAt;
    }
}
