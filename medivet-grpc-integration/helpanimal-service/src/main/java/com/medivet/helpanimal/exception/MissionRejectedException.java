package com.medivet.helpanimal.exception;

import org.springframework.http.HttpStatus;

/** RescueCoordination refuse l'operation (mission en escalade, desistement impossible...) : 409. */
public class MissionRejectedException extends ApiException {

    public MissionRejectedException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
