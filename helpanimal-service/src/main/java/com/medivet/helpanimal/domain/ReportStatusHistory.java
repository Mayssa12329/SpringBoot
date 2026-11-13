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

/** Une ligne d'historique par changement d'etat (US24). */
@Entity
@Table(name = "report_status_history")
public class ReportStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_id", nullable = false)
    private Long reportId;

    /** Null pour la creation du signalement. */
    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 20)
    private ReportStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 20)
    private ReportStatus toStatus;

    @Column(name = "actor_id", nullable = false)
    private Long actorId;

    @Column(length = 1000)
    private String comment;

    @Column(name = "changed_at", nullable = false)
    private Instant changedAt;

    protected ReportStatusHistory() {
        // requis par JPA
    }

    public ReportStatusHistory(Long reportId, ReportStatus fromStatus, ReportStatus toStatus,
                               Long actorId, String comment, Instant changedAt) {
        this.reportId = reportId;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.actorId = actorId;
        this.comment = comment;
        this.changedAt = changedAt;
    }

    public Long getId() {
        return id;
    }

    public Long getReportId() {
        return reportId;
    }

    public ReportStatus getFromStatus() {
        return fromStatus;
    }

    public ReportStatus getToStatus() {
        return toStatus;
    }

    public Long getActorId() {
        return actorId;
    }

    public String getComment() {
        return comment;
    }

    public Instant getChangedAt() {
        return changedAt;
    }
}
