package com.medivet.rescue.model;

/** Cycle de vie d'une mission. */
public enum MissionStatus {
    /** Diffusee aux intervenants, en attente d'acceptation. */
    OPEN,
    /** Acceptee par un intervenant (RM04 : un seul). */
    ASSIGNED,
    IN_PROGRESS,
    COMPLETED,
    /** RM05 : trop de reattributions, l'administrateur doit intervenir. */
    ESCALATED
}
