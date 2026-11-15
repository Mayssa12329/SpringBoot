package com.medivet.vetbooking.enums;

/**
 * Lifecycle states of an appointment.
 */
public enum AppointmentStatus {
    PENDING,
    CONFIRMED,
    CANCELLED,
    LATE_CANCELLED,  // Cancellation < 2 h before slot (RM07)
    COMPLETED
}
