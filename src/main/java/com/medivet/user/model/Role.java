package com.medivet.user.model;

/**
 * Les rôles disponibles dans l'application MEDIVET.
 * US04 : Un administrateur peut attribuer ces rôles aux utilisateurs.
 */
public enum Role {
    UTILISATEUR,     // Rôle de base pour tout nouveau compte
    VETERINAIRE,     // Accès aux fonctionnalités vétérinaires
    ADMINISTRATEUR   // Accès complet + gestion des utilisateurs
}
