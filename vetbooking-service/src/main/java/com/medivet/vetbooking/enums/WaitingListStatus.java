package com.medivet.vetbooking.enums;

/**
 * Status of a waiting-list entry.
 */
public enum WaitingListStatus {
    WAITING,
    OFFERED,    // Slot was offered; waiting for acceptance (30 min window — RM08)
    ACCEPTED,
    EXPIRED,    // Offer window elapsed without response
    CANCELLED
}
