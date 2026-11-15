package com.medivet.vetbooking.event;

import com.medivet.vetbooking.enums.NotificationType;
import org.springframework.context.ApplicationEvent;

/**
 * Spring application event published whenever a business action
 * requires notifying a user (US17 / RM14).
 *
 * Published via ApplicationEventPublisher.publishEvent().
 * Consumed by NotificationService.onNotificationEvent() (@EventListener).
 *
 * The idempotencyKey prevents duplicate DB rows for the same event (RM14).
 * Convention: "<TYPE>-<referenceId>[-<recipientId>]"
 * Example:    "APPOINTMENT_CONFIRMED-42-7"
 */
public class NotificationEvent extends ApplicationEvent {

    private final Long recipientId;
    private final NotificationType type;
    private final String message;
    private final Long referenceId;
    private final String idempotencyKey;

    private NotificationEvent(Builder builder) {
        super(builder.source);
        this.recipientId    = builder.recipientId;
        this.type           = builder.type;
        this.message        = builder.message;
        this.referenceId    = builder.referenceId;
        this.idempotencyKey = builder.idempotencyKey;
    }

    // ── Getters ──────────────────────────────────────────────────────────────

    public Long getRecipientId()    { return recipientId; }
    public NotificationType getType() { return type; }
    public String getMessage()      { return message; }
    public Long getReferenceId()    { return referenceId; }
    public String getIdempotencyKey() { return idempotencyKey; }

    // ── Builder ───────────────────────────────────────────────────────────────

    public static Builder builder(Object source) {
        return new Builder(source);
    }

    public static final class Builder {
        private final Object source;
        private Long recipientId;
        private NotificationType type;
        private String message;
        private Long referenceId;
        private String idempotencyKey;

        private Builder(Object source) { this.source = source; }

        public Builder recipientId(Long recipientId) {
            this.recipientId = recipientId; return this;
        }
        public Builder type(NotificationType type) {
            this.type = type; return this;
        }
        public Builder message(String message) {
            this.message = message; return this;
        }
        public Builder referenceId(Long referenceId) {
            this.referenceId = referenceId; return this;
        }
        /** Auto-generates key as "<type>-<referenceId>-<recipientId>". */
        public Builder autoKey() {
            this.idempotencyKey = type.name() + "-" + referenceId + "-" + recipientId;
            return this;
        }
        /** Explicit idempotency key — use when auto-key is not unique enough. */
        public Builder idempotencyKey(String key) {
            this.idempotencyKey = key; return this;
        }
        public NotificationEvent build() {
            if (recipientId == null || type == null || message == null || idempotencyKey == null) {
                throw new IllegalStateException(
                    "NotificationEvent requires recipientId, type, message and idempotencyKey");
            }
            return new NotificationEvent(this);
        }
    }
}
