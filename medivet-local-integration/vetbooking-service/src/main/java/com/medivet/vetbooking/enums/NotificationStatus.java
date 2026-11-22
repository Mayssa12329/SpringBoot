package com.medivet.vetbooking.enums;

/**
 * Lifecycle state of a persisted notification (US17 / RM14).
 */
public enum NotificationStatus {
    UNREAD,   // Notification créée, non consultée
    READ,     // Marquée lue par l'utilisateur
    FAILED    // Tentative d'envoi échouée (log + retry possible, RM14)
}
