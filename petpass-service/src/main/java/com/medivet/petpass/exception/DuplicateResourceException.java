package com.medivet.petpass.exception;

/**
 * Exception levée lorsqu'une ressource existe déjà (ex. numéro de puce en double).
 * Mappe vers HTTP 409 CONFLICT.
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}
