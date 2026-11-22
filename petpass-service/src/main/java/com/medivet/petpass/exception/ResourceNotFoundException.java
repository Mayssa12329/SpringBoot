package com.medivet.petpass.exception;

/**
 * Exception levée lorsqu'une ressource demandée n'existe pas.
 * Mappe vers HTTP 404 NOT FOUND.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
