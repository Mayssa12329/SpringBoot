package com.medivet.helpanimal.security;

/**
 * Roles de UserService (module authentification), vus par HelpAnimal.
 * <ul>
 *   <li>UTILISATEUR : citoyen qui signale un animal</li>
 *   <li>VETERINAIRE : benevole et intervenant (qualifie, consulte les signalements proches, accepte une mission)</li>
 *   <li>ADMINISTRATEUR : moderation et journal d'audit</li>
 * </ul>
 */
public enum Role {
    UTILISATEUR,
    VETERINAIRE,
    ADMINISTRATEUR
}
