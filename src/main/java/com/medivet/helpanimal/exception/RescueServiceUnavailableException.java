package com.medivet.helpanimal.exception;

import org.springframework.http.HttpStatus;

/** 503 : RescueCoordination indisponible (RM13). Le signalement reste Qualifie. */
public class RescueServiceUnavailableException extends ApiException {

    public RescueServiceUnavailableException(String message) {
        super(HttpStatus.SERVICE_UNAVAILABLE, message);
    }
}
