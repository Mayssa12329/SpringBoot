package com.medivet.authentification.user.controller;

import com.medivet.authentification.user.dto.*;
import com.medivet.authentification.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Controller pour les routes d'authentification (sans token requis).
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "1. Authentification & Accès", description = "Inscription, connexion JWT et gestion des identifiants (US01, US02, US05)")
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
    @Operation(summary = "Créer un compte propriétaire (US01)", description = "Inscrit un nouvel utilisateur propriétaire d'animaux")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Compte créé avec succès"),
            @ApiResponse(responseCode = "400", description = "Données de formulaire invalides"),
            @ApiResponse(responseCode = "409", description = "Un compte avec cet email existe déjà")
    })
    public ResponseEntity<String> inscription(@Valid @RequestBody RegisterRequest request) {
        userService.inscrire(request);
        return ResponseEntity.status(HttpStatus.CREATED).body("Compte créé avec succès !");
    }

    // ================================================================
    // US01 - Inscription professionnelle pour les Vétérinaires (avec diplôme)
    // POST /api/auth/inscription-pro (multipart/form-data)
    // ================================================================
    @PostMapping(value = "/inscription-pro", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Inscription professionnelle Vétérinaire avec diplôme (US01)", description = "Téléversement du diplôme officiel pour vérification")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Inscription réussie en attente de validation admin"),
            @ApiResponse(responseCode = "400", description = "Diplôme manquant ou formulaire invalide"),
            @ApiResponse(responseCode = "409", description = "Email déjà existant")
    })
    public ResponseEntity<String> inscriptionProfessionnelle(
            @RequestParam("nom") String nom,
            @RequestParam("prenom") String prenom,
            @RequestParam("email") String email,
            @RequestParam("motDePasse") String motDePasse,
            @RequestParam("telephone") String telephone,
            @RequestParam("diplome") MultipartFile diplome) {
        userService.inscrireProfessionnel(nom, prenom, email, motDePasse, telephone, diplome);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Inscription professionnelle réussie ! Votre compte a été créé en attente de vérification de votre diplôme par un administrateur.");
    }

    // ================================================================
    // US02 - Se connecter (page commune : utilisateur, vétérinaire, admin)
    // POST /api/auth/connexion
    // ================================================================
    @PostMapping("/connexion")
    @Operation(summary = "Se connecter et obtenir un Token JWT (US02)", description = "Authentification commune pour propriétaires, vétérinaires et admins")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Authentification réussie, token JWT retourné"),
            @ApiResponse(responseCode = "401", description = "Identifiants invalides (email ou mot de passe incorrect)")
    })
    public ResponseEntity<LoginResponse> connexion(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = userService.connecter(request);
        return ResponseEntity.ok(response);
    }

    // ================================================================
    // US05 - Demander la réinitialisation du mot de passe (étape 1)
    // ================================================================
    @PostMapping("/mot-de-passe-oublie")
    @Operation(summary = "Demander la réinitialisation du mot de passe (US05)", description = "Génère un token de réinitialisation temporaire")
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
    @Operation(summary = "Définir un nouveau mot de passe avec le token (US05)", description = "Valide le token et met à jour le mot de passe")
    public ResponseEntity<String> reinitialiserMotDePasse(@Valid @RequestBody ResetPasswordRequest request) {
        userService.reinitialiserMotDePasse(request);
        return ResponseEntity.ok("Mot de passe réinitialisé avec succès !");
    }
}
