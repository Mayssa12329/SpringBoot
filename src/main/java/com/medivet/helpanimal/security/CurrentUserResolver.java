package com.medivet.helpanimal.security;

import java.util.EnumSet;
import java.util.Set;

import com.medivet.authentification.user.model.User;
import com.medivet.authentification.user.repository.UserRepository;
import com.medivet.helpanimal.exception.UnauthorizedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

/**
 * Traduit l'authentification de UserService en {@link CurrentUser}.
 * Le JwtFilter de l'equipe place l'email dans le principal et le role dans les autorites ;
 * HelpAnimal stocke l'identifiant numerique de l'utilisateur (comme ownerId dans PetPass).
 */
@Component
public class CurrentUserResolver {

    private static final String ROLE_PREFIX = "ROLE_";

    private final UserRepository userRepository;

    public CurrentUserResolver(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public CurrentUser resolve(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw new UnauthorizedException("Authentification requise");
        }
        Long id = userRepository.findByEmail(authentication.getName())
            .map(User::getId)
            .orElseThrow(() -> new UnauthorizedException("Utilisateur inconnu de UserService"));
        return new CurrentUser(id, rolesOf(authentication));
    }

    private static Set<Role> rolesOf(Authentication authentication) {
        Set<Role> roles = EnumSet.noneOf(Role.class);
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            String name = authority.getAuthority();
            if (name != null && name.startsWith(ROLE_PREFIX)) {
                try {
                    roles.add(Role.valueOf(name.substring(ROLE_PREFIX.length())));
                } catch (IllegalArgumentException ignored) {
                    // Role inconnu de HelpAnimal : sans effet sur les droits
                }
            }
        }
        return roles;
    }
}
