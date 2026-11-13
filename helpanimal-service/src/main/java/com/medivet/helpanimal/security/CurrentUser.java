package com.medivet.helpanimal.security;

import java.util.EnumSet;
import java.util.Set;

import com.medivet.helpanimal.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

/** Utilisateur connecte, extrait du jeton JWT (subject = id, claim roles). */
public record CurrentUser(Long id, Set<Role> roles) {

    public static CurrentUser from(Authentication authentication) {
        if (authentication == null) {
            throw new UnauthorizedException("Authentification requise");
        }
        Long id;
        try {
            id = Long.valueOf(authentication.getName());
        } catch (NumberFormatException e) {
            throw new UnauthorizedException("Le subject du jeton doit etre l'id numerique de l'utilisateur");
        }
        Set<Role> roles = EnumSet.noneOf(Role.class);
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            String name = authority.getAuthority();
            if (name != null && name.startsWith("ROLE_")) {
                try {
                    roles.add(Role.valueOf(name.substring(5)));
                } catch (IllegalArgumentException ignored) {
                    // role inconnu de ce service : ignore
                }
            }
        }
        return new CurrentUser(id, roles);
    }

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
        return roles.contains(Role.ADMIN);
    }
}
