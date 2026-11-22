package com.medivet.vetbooking.exception;

/**
 * Thrown when a requested operation is logically invalid in the current state
 * (e.g. cancelling an already-cancelled appointment, joining waiting list twice).
 * Mapped to HTTP 422 Unprocessable Entity by the global exception handler.
 */
public class InvalidOperationException extends RuntimeException {

    public InvalidOperationException(String message) {
        super(message);
    }
}
