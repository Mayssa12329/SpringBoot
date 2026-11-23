package com.medivet.vetbooking.exception;

/**
 * Thrown when a booking attempt targets a slot that is already BOOKED or BLOCKED.
 * Mapped to HTTP 409 Conflict by the global exception handler (RM06).
 */
public class SlotAlreadyBookedException extends RuntimeException {

    public SlotAlreadyBookedException(Long slotId) {
        super("Slot " + slotId + " is already booked or unavailable.");
    }
}
