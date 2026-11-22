package com.medivet.helpanimal.exception;

import org.springframework.http.HttpStatus;

/** 404 : ressource introuvable. */
public class NotFoundException extends ApiException {

    public NotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}
