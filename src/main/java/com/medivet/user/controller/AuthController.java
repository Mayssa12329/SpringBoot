package com.medivet.user.controller;

import com.medivet.user.dto.*;
import com.medivet.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Controller pour les routes d'authentification (sans token requis).
 *
 * Routes :
 *   POST /api/auth/inscription                  → US01 Créer un compte utilisateur normal
 *   POST /api/auth/inscription-pro              → US01 Inscription professionnelle vétérinaire (avec diplôme)
 *   POST /api/auth/connexion                    → US02 Se connecter (commun tous utilisateurs)
 *   POST /api/auth/mot-de-passe-oublie          → US05 Obtenir le token de reset
 *   POST /api/auth/reinitialiser-mot-de-passe   → US05 Changer le mot de passe
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    // ================================================================
    // US01 - Créer un compte utilisateur normal
    // POST /api/auth/inscription
    // ================================================================
    @PostMapping("/inscription")
    public ResponseEntity<String> inscription(@Valid @RequestBody RegisterRequest request) {
        try {
            userService.inscrire(request);
            return ResponseEntity.status(HttpStatus.CREATED).body("Compte créé avec succès !");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    // ================================================================
    // US01 - Inscription professionnelle pour les Vétérinaires (avec diplôme)
    // POST /api/auth/inscription-pro (multipart/form-data)
    // ================================================================
    @PostMapping(value = "/inscription-pro", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> inscriptionProfessionnelle(
            @RequestParam("nom") String nom,
            @RequestParam("prenom") String prenom,
            @RequestParam("email") String email,
            @RequestParam("motDePasse") String motDePasse,
            @RequestParam("telephone") String telephone,
            @RequestParam("diplome") MultipartFile diplome) {
        try {
            userService.inscrireProfessionnel(nom, prenom, email, motDePasse, telephone, diplome);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body("Inscription professionnelle réussie ! Votre compte a été créé en attente de vérification de votre diplôme par un administrateur.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // ================================================================
    // US02 - Se connecter (page commune : utilisateur, vétérinaire, admin)
    // POST /api/auth/connexion
    // ================================================================
    @PostMapping("/connexion")
    public ResponseEntity<?> connexion(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = userService.connecter(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    // ================================================================
    // US05 - Demander la réinitialisation du mot de passe (étape 1)
    // ================================================================
    @PostMapping("/mot-de-passe-oublie")
    public ResponseEntity<String> motDePasseOublie(@Valid @RequestBody ForgotPasswordRequest request) {
        String token = userService.demanderReinitialisationMotDePasse(request);

        if (token != null) {
            return ResponseEntity.ok("Token de réinitialisation : " + token);
        } else {
            return ResponseEntity.ok("Si un compte existe avec cet email, un token a été généré.");
        }
    }

    // ================================================================
    // US05 - Réinitialiser le mot de passe (étape 2)
    // ================================================================
    @PostMapping("/reinitialiser-mot-de-passe")
    public ResponseEntity<String> reinitialiserMotDePasse(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            userService.reinitialiserMotDePasse(request);
            return ResponseEntity.ok("Mot de passe réinitialisé avec succès !");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
