package com.medivet.vetbooking.service;

import com.medivet.vetbooking.dto.response.NotificationResponse;
import com.medivet.vetbooking.entity.Notification;
import com.medivet.vetbooking.enums.NotificationStatus;
import com.medivet.vetbooking.event.NotificationEvent;
import com.medivet.vetbooking.exception.ResourceNotFoundException;
import com.medivet.vetbooking.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * US17 — Notification service.
 *
 * Responsibilities:
 *  1. Listen to NotificationEvent via @EventListener and persist to DB.
 *  2. Guarantee idempotency: duplicate events with same key are silently ignored (RM14).
 *  3. Expose REST-facing query and mutation methods.
 *
 * Transaction strategy:
 *  - onNotificationEvent() runs in REQUIRES_NEW so that a notification
 *    failure never rolls back the caller's business transaction (booking,
 *    cancellation, etc.).
 *  - If persistence fails, the error is logged (RM14 — "échec final tracé").
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    // ── Event listener ────────────────────────────────────────────────────────

    /**
     * Receives a NotificationEvent published by any service and persists it.
     *
     * @Async ensures the listener does not block the publishing thread.
     * REQUIRES_NEW ensures the notification transaction is independent:
     *   - A listener failure does NOT roll back the business transaction.
     *   - The notification IS committed even if the caller's transaction later fails
     *     (acceptable trade-off for MVP; saga / outbox pattern for production).
     */
    @Async
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onNotificationEvent(NotificationEvent event) {
        // RM14 — idempotency: skip if already persisted
        if (notificationRepository.existsByIdempotencyKey(event.getIdempotencyKey())) {
            log.debug("Notification already exists for key '{}' — skipped (RM14)",
                    event.getIdempotencyKey());
            return;
        }

        try {
            Notification notification = new Notification();
            notification.setRecipientId(event.getRecipientId());
            notification.setType(event.getType());
            notification.setMessage(event.getMessage());
            notification.setReferenceId(event.getReferenceId());
            notification.setIdempotencyKey(event.getIdempotencyKey());
            notification.setStatus(NotificationStatus.UNREAD);

            notificationRepository.save(notification);

            log.info("[US17] Notification persisted — type={} recipient={} ref={}",
                    event.getType(), event.getRecipientId(), event.getReferenceId());

        } catch (Exception e) {
            // RM14 — failure logged and traceable; does NOT crash the business flow
            log.error("[US17] Failed to persist notification type={} key={}: {}",
                    event.getType(), event.getIdempotencyKey(), e.getMessage(), e);
        }
    }

    // ── Query ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<NotificationResponse> getByRecipient(Long recipientId) {
        return notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(recipientId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUnreadByRecipient(Long recipientId) {
        return notificationRepository
                .findByRecipientIdAndStatusOrderByCreatedAtDesc(
                        recipientId, NotificationStatus.UNREAD)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long countUnread(Long recipientId) {
        return notificationRepository.countByRecipientIdAndStatus(
                recipientId, NotificationStatus.UNREAD);
    }

    // ── Mutations ─────────────────────────────────────────────────────────────

    /**
     * Marks a single notification as READ.
     * Returns 404 if not found, 422 if it belongs to a different recipient.
     */
    @Transactional
    public NotificationResponse markRead(Long notificationId, Long recipientId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));

        if (!notification.getRecipientId().equals(recipientId)) {
            throw new com.medivet.vetbooking.exception.InvalidOperationException(
                    "Notification " + notificationId + " does not belong to recipient " + recipientId);
        }

        if (notification.getStatus() == NotificationStatus.UNREAD) {
            notification.setStatus(NotificationStatus.READ);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
        return toResponse(notification);
    }

    /** Marks ALL unread notifications of a recipient as read. */
    @Transactional
    public int markAllRead(Long recipientId) {
        return notificationRepository.markAllReadForRecipient(recipientId);
    }

    // ── Mapper ────────────────────────────────────────────────────────────────

    private NotificationResponse toResponse(Notification n) {
        NotificationResponse r = new NotificationResponse();
        r.setId(n.getId());
        r.setRecipientId(n.getRecipientId());
        r.setType(n.getType());
        r.setStatus(n.getStatus());
        r.setMessage(n.getMessage());
        r.setReferenceId(n.getReferenceId());
        r.setCreatedAt(n.getCreatedAt());
        r.setReadAt(n.getReadAt());
        return r;
    }
}
