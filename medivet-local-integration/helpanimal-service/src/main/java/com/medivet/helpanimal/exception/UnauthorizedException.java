package com.medivet.helpanimal.exception;

import org.springframework.http.HttpStatus;

/** 401 : jeton absent ou invalide. */
public class UnauthorizedException extends ApiException {

    public UnauthorizedException(String message) {
        super(HttpStatus.UNAUTHORIZED, message);
    }
}
