package com.medivet.vetpharma.enums;

/**
 * Niveau de disponibilité d'un stock.
 *
 * <ul>
 *   <li>DISPONIBLE – quantité > 10</li>
 *   <li>FAIBLE      – quantité entre 1 et 10 inclus</li>
 *   <li>RUPTURE     – quantité = 0</li>
 * </ul>
 */
public enum StatutStock {
    DISPONIBLE,
    FAIBLE,
    RUPTURE
}
