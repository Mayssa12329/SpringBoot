package com.medivet.helpanimal.exception;

import org.springframework.http.HttpStatus;

/** 400 : requete invalide. */
public class BadRequestException extends ApiException {

    public BadRequestException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
