package com.medivet.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Utilitaire JWT : génère et valide les tokens d'authentification.
 *
 * Fonctionnement JWT :
 * 1. L'utilisateur se connecte → le serveur génère un token signé
 * 2. Le frontend stocke ce token et l'envoie dans le header "Authorization: Bearer <token>"
 * 3. Le serveur vérifie la signature du token à chaque requête protégée
 */
@Component
public class JwtUtil {

    // Clé secrète lue depuis application.properties
    @Value("${jwt.secret}")
    private String secret;

    // Durée de validité lue depuis application.properties (en ms)
    @Value("${jwt.expiration}")
    private long expiration;

    /**
     * Génère une clé cryptographique à partir du secret en application.properties.
     */
    private SecretKey getCle() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    /**
     * Génère un token JWT contenant l'email de l'utilisateur.
     * @param email L'identifiant de l'utilisateur
     * @return Le token JWT sous forme de String
     */
    public String genererToken(String email) {
        return Jwts.builder()
                .subject(email)                                    // Qui est l'utilisateur
                .issuedAt(new Date())                              // Quand le token a été créé
                .expiration(new Date(System.currentTimeMillis() + expiration)) // Quand il expire
                .signWith(getCle())                                // Signature pour l'authenticité
                .compact();
    }

    /**
     * Extrait l'email depuis un token JWT.
     * @param token Le token JWT
     * @return L'email de l'utilisateur
     */
    public String extraireEmail(String token) {
        return extraireClaims(token).getSubject();
    }

    /**
     * Vérifie si un token est encore valide (non expiré et bien signé).
     * @param token Le token à vérifier
     * @return true si le token est valide
     */
    public boolean estValide(String token) {
        try {
            extraireClaims(token); // Si ça ne lève pas d'exception, le token est valide
            return true;
        } catch (Exception e) {
            return false; // Token expiré, mal formé ou signature incorrecte
        }
    }

    /**
     * Parse le token et retourne son contenu (claims).
     */
    private Claims extraireClaims(String token) {
        return Jwts.parser()
                .verifyWith(getCle())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
