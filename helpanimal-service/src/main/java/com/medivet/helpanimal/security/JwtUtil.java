package com.medivet.helpanimal.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret:MedivetSecretKey2024SuperLongueClePourLaSecuriteJWT!}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private long expiration;

    private SecretKey getCle() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String genererToken(String email) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getCle())
                .compact();
    }

    public String extraireEmail(String token) {
        return extraireClaims(token).getSubject();
    }

    public boolean estValide(String token) {
        try {
            extraireClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims extraireClaims(String token) {
        return Jwts.parser()
                .verifyWith(getCle())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
