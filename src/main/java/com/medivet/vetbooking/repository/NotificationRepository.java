package com.medivet.vetbooking.repository;

import com.medivet.vetbooking.entity.Notification;
import com.medivet.vetbooking.enums.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /** All notifications for a recipient, newest first. */
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    /** Unread notifications only. */
    List<Notification> findByRecipientIdAndStatusOrderByCreatedAtDesc(
            Long recipientId, NotificationStatus status);

    /** Count of unread notifications (used by frontend badge). */
    long countByRecipientIdAndStatus(Long recipientId, NotificationStatus status);

    /** Idempotency check — does a notification for this key already exist? (RM14) */
    boolean existsByIdempotencyKey(String idempotencyKey);

    /** Bulk mark-all-read for a recipient. */
    @Modifying
    @Query("""
        UPDATE Notification n
        SET n.status = 'READ', n.readAt = CURRENT_TIMESTAMP
        WHERE n.recipientId = :recipientId
          AND n.status = 'UNREAD'
        """)
    int markAllReadForRecipient(@Param("recipientId") Long recipientId);
}
