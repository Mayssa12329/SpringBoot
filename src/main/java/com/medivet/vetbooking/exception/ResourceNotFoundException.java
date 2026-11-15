package com.medivet.vetbooking.exception;

/**
 * Thrown when a requested resource (Vet, Slot, Appointment, WaitingListEntry) does not exist.
 * Mapped to HTTP 404 by the global exception handler.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceName, Long id) {
        super(resourceName + " not found with id: " + id);
    }
}
