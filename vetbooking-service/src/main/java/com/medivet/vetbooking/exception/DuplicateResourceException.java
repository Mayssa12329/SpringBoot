package com.medivet.vetbooking.exception;

/**
 * Thrown when a creation request would produce a duplicate (e.g. duplicate email, overlapping slot).
 * Mapped to HTTP 409 Conflict by the global exception handler.
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}
