package com.medivet.vetpharma.enums;

/**
 * Cycle de vie d'une réservation (RM11).
 *
 * <ul>
 *   <li>EN_ATTENTE  – créée, TTL de 15 min en cours</li>
 *   <li>CONFIRMEE   – validée avant expiration</li>
 *   <li>ANNULEE     – annulée explicitement par le client</li>
 *   <li>EXPIREE     – TTL dépassé, stock restitué automatiquement</li>
 * </ul>
 */
public enum StatutReservation {
    EN_ATTENTE,
    CONFIRMEE,
    ANNULEE,
    EXPIREE
}
