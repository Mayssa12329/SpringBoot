package com.medivet.config;

import com.medivet.security.JwtFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Configuration de Spring Security.
 *
 * Règles d'accès :
 * - Pages statiques   : accessible à tous pour l'interface de test (/, /index.html)
 * - Routes publiques  : inscription, connexion, récupération de mot de passe
 * - Routes protégées  : profil utilisateur connecté
 * - Routes admin only : attribution des rôles et liste des utilisateurs
 */
@Configuration
@EnableMethodSecurity  // Active @PreAuthorize dans les controllers
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Activer CORS pour permettre les requêtes depuis l'interface web locale
            .cors(Customizer.withDefaults())

            // Désactiver CSRF (inutile pour une API REST avec JWT)
            .csrf(csrf -> csrf.disable())

            // Pas de session HTTP → chaque requête doit avoir un token JWT
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Définition des routes et leurs permissions
            .authorizeHttpRequests(auth -> auth

                // ===== INTERFACE DE TEST STATIQUE & UPLOADS =====
                .requestMatchers("/", "/index.html", "/*.html", "/static/**", "/css/**", "/js/**", "/favicon.ico", "/uploads/**").permitAll()

                // ===== ROUTES PUBLIQUES (sans token) =====
                .requestMatchers(HttpMethod.POST, "/api/auth/inscription").permitAll()       // US01 - Créer un compte utilisateur
                .requestMatchers(HttpMethod.POST, "/api/auth/inscription-pro").permitAll()   // US01 Pro - Inscription vétérinaire avec diplôme
                .requestMatchers(HttpMethod.POST, "/api/auth/connexion").permitAll()         // US02 - Se connecter
                .requestMatchers(HttpMethod.POST, "/api/auth/mot-de-passe-oublie").permitAll() // US05 - Demander reset
                .requestMatchers(HttpMethod.POST, "/api/auth/reinitialiser-mot-de-passe").permitAll() // US05 - Réinitialiser

                // ===== ROUTES ADMIN UNIQUEMENT =====
                .requestMatchers(HttpMethod.GET, "/api/utilisateurs").hasRole("ADMINISTRATEUR")          // US04 - Liste
                .requestMatchers(HttpMethod.PUT, "/api/utilisateurs/{id}/role").hasRole("ADMINISTRATEUR") // US04 - Rôles

                // ===== TOUTES LES AUTRES ROUTES : connecté =====
                .anyRequest().authenticated()
            )

            // Ajouter notre filtre JWT AVANT le filtre d'authentification par défaut de Spring
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Configuration CORS pour autoriser l'interface de test
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /**
     * Bean BCrypt pour hasher les mots de passe.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
