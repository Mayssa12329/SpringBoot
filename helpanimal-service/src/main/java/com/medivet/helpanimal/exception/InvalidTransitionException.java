package com.medivet.helpanimal.exception;

import org.springframework.http.HttpStatus;

/** 409 : transition d'etat interdite (RM03). L'etat reste inchange. */
public class InvalidTransitionException extends ApiException {

    public InvalidTransitionException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
