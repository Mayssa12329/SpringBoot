package com.medivet.rescue.service;

/** Aucune mission pour ce signalement (gRPC NOT_FOUND). */
public class MissionNotFoundException extends RuntimeException {

    public MissionNotFoundException(Long reportId) {
        super("Aucune mission pour le signalement " + reportId);
    }
}
