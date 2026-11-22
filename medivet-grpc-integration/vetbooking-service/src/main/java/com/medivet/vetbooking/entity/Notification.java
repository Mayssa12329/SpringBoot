package com.medivet.vetbooking.entity;

import com.medivet.vetbooking.enums.NotificationStatus;
import com.medivet.vetbooking.enums.NotificationType;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * A notification persisted in PostgreSQL (US17 / RM14).
 *
 * Design decisions:
 *  - recipientId references the UserService owner/vet — stored by value, no FK.
 *  - idempotencyKey prevents duplicate notifications for the same business event (RM14).
 *    Format: "<type>-<referenceId>" e.g. "APPOINTMENT_CONFIRMED-42"
 *  - payload stores a human-readable message (can be extended to JSON in future).
 */
@Entity
@Table(
    name = "notifications",
    indexes = {
        @Index(name = "idx_notif_recipient", columnList = "recipient_id, status"),
        @Index(name = "idx_notif_idempotency", columnList = "idempotency_key", unique = true)
    }
)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID of the user who should receive this notification (owner or vet). */
    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationStatus status = NotificationStatus.UNREAD;

    /** Human-readable message displayed to the user. */
    @Column(nullable = false, length = 500)
    private String message;

    /**
     * Reference to the business object that triggered the notification.
     * For appointments: appointmentId. For waiting-list offers: entryId.
     */
    @Column(name = "reference_id")
    private Long referenceId;

    /**
     * Idempotency key — prevents duplicate notifications for the same event (RM14).
     * Unique constraint at DB level.
     */
    @Column(name = "idempotency_key", nullable = false, unique = true, length = 100)
    private String idempotencyKey;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "read_at")
    private LocalDateTime readAt;

    // ── Constructors ────────────────────────────────────────────────────────

    public Notification() {}

    // ── Getters & Setters ───────────────────────────────────────────────────

    public Long getId() { return id; }

    public Long getRecipientId() { return recipientId; }
    public void setRecipientId(Long recipientId) { this.recipientId = recipientId; }

    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }

    public NotificationStatus getStatus() { return status; }
    public void setStatus(NotificationStatus status) { this.status = status; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Long getReferenceId() { return referenceId; }
    public void setReferenceId(Long referenceId) { this.referenceId = referenceId; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }
}
