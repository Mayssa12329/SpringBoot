package com.medivet.helpanimal.exception;

import org.springframework.http.HttpStatus;

/** 403 : l'utilisateur n'a pas le droit de faire cette action. */
public class ForbiddenActionException extends ApiException {

    public ForbiddenActionException(String message) {
        super(HttpStatus.FORBIDDEN, message);
    }
}
