package com.medivet.user.dto;

import com.medivet.user.model.Role;
import jakarta.validation.constraints.NotNull;

/**
 * US04 - Données envoyées par un ADMINISTRATEUR pour changer le rôle d'un utilisateur.
 * Exemple de body JSON : { "role": "VETERINAIRE" }
 */
public class AssignRoleRequest {

    @NotNull(message = "Le rôle est obligatoire")
    private Role role;

    // Getter & Setter
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
