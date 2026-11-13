package com.medivet.security;

import com.medivet.user.model.User;
import com.medivet.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * Filtre JWT : intercepte chaque requête HTTP et vérifie le token.
 *
 * Fonctionnement :
 * 1. Cherche le header "Authorization: Bearer <token>"
 * 2. Extrait et valide le token JWT
 * 3. Si valide → authentifie l'utilisateur dans Spring Security
 * 4. Si invalide ou absent → la requête continue sans authentification (Spring Security bloquera si la route est protégée)
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public JwtFilter(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 1. Lire le header Authorization
        String authHeader = request.getHeader("Authorization");

        // 2. Vérifier qu'il commence bien par "Bearer "
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7); // Enlève "Bearer " pour garder juste le token

            // 3. Valider le token
            if (jwtUtil.estValide(token)) {
                String email = jwtUtil.extraireEmail(token);

                // 4. Charger l'utilisateur depuis la base de données
                Optional<User> userOpt = userRepository.findByEmail(email);

                if (userOpt.isPresent()) {
                    User user = userOpt.get();

                    // 5. Créer l'objet d'authentification avec le rôle de l'utilisateur
                    // "ROLE_" est un préfixe requis par Spring Security
                    String role = "ROLE_" + user.getRole().name();
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            List.of(new SimpleGrantedAuthority(role))
                    );

                    // 6. Enregistrer l'authentification dans le contexte de sécurité
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        }

        // Continuer la chaîne de filtres
        filterChain.doFilter(request, response);
    }
}
