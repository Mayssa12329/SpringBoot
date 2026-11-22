package com.medivet.helpanimal.exception;

import org.springframework.http.HttpStatus;

/** RM13 : RescueCoordination ne repond pas ; le signalement garde son etat (503). */
public class RescueServiceUnavailableException extends ApiException {

    public RescueServiceUnavailableException(String message) {
        super(HttpStatus.SERVICE_UNAVAILABLE, message);
    }
}
