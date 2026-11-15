package com.medivet.vetbooking.enums;

/**
 * Describes which business event triggered the notification (US17).
 */
public enum NotificationType {
    APPOINTMENT_CONFIRMED,   // US15 — créneau réservé avec succès
    APPOINTMENT_MODIFIED,    // US16 — rendez-vous déplacé ou notes modifiées
    APPOINTMENT_CANCELLED,   // US16 — rendez-vous annulé (normal ou tardif)
    WAITING_LIST_OFFER       // US18 — créneau libéré proposé à l'owner en attente
}
