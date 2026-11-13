package com.medivet.helpanimal.domain;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

/** Etats d'un signalement (RM03). */
public enum ReportStatus {
    NOUVEAU,
    QUALIFIE,
    ATTRIBUE,
    EN_COURS,
    TERMINE,
    REJETE,
    MASQUE;

    /** Signalements encore "vivants" : affiches sur la carte et pris en compte pour les doublons. */
    public static final Set<ReportStatus> ACTIVE =
        Collections.unmodifiableSet(EnumSet.of(NOUVEAU, QUALIFIE, ATTRIBUE, EN_COURS));

    public boolean isActive() {
        return ACTIVE.contains(this);
    }
}
