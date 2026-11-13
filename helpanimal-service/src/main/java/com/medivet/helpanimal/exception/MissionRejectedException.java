package com.medivet.helpanimal.exception;

import org.springframework.http.HttpStatus;

/** 409 : RescueCoordination a refuse l'affectation. */
public class MissionRejectedException extends ApiException {

    public MissionRejectedException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
