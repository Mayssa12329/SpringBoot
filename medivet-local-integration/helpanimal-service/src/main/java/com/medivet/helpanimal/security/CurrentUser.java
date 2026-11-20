package com.medivet.helpanimal.security;

import java.util.Set;

/** Utilisateur connecte, tel que HelpAnimal le voit : son identifiant UserService et ses roles. */
public record CurrentUser(Long id, Set<Role> roles) {

    public boolean hasRole(Role role) {
        return roles.contains(role);
    }

    public boolean hasAnyRole(Role... candidates) {
        for (Role role : candidates) {
            if (roles.contains(role)) {
                return true;
            }
        }
        return false;
    }

    public boolean isAdmin() {
        return roles.contains(Role.ADMINISTRATEUR);
    }
}
