package com.medivet.vetbooking.exception;

/**
 * Thrown when the requested consultation type is not supported by the vet.
 * Mapped to HTTP 422 Unprocessable Entity by the global exception handler (RM07).
 */
public class IncompatibleConsultationTypeException extends RuntimeException {

    public IncompatibleConsultationTypeException(String vetName, String consultationType) {
        super("Vet " + vetName + " does not support consultation type: " + consultationType);
    }
}
