package com.medivet.rescue.model;

/** Evenements diffuses en streaming et conserves dans l'historique. */
public enum MissionEventType {
    PUBLISHED,
    ASSIGNED,
    DECLINED,
    REASSIGNED,
    ESCALATED,
    IN_PROGRESS,
    COMPLETED
}
