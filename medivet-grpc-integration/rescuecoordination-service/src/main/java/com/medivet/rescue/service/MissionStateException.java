package com.medivet.rescue.service;

/** Operation impossible dans l'etat actuel de la mission (gRPC FAILED_PRECONDITION). */
public class MissionStateException extends RuntimeException {

    public MissionStateException(String message) {
        super(message);
    }
}
