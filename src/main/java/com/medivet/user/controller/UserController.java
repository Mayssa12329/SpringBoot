package com.medivet.user.controller;

import com.medivet.user.dto.AssignRoleRequest;
import com.medivet.user.dto.UpdateProfileRequest;
import com.medivet.user.model.User;
import com.medivet.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Controller pour les routes utilisateur (token JWT requis).
 *
 * Routes :
 *   GET  /api/utilisateurs/moi             → Voir son profil
 *   PUT  /api/utilisateurs/moi             → US03 Modifier son profil
 *   PUT  /api/utilisateurs/{id}/role       → US04 Attribuer un rôle (admin)
 *
 * Note : "Authentication auth" est injecté automatiquement par Spring Security.
 *         auth.getName() retourne l'email de l'utilisateur connecté (extrait du token JWT).
 */
@RestController
@RequestMapping("/api/utilisateurs")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ================================================================
    // Voir son propre profil (utilisateur connecté)
    // GET /api/utilisateurs/moi
    // Header requis : Authorization: Bearer <token>
    // ================================================================
    @GetMapping("/moi")
    public ResponseEntity<User> monProfil(Authentication auth) {
        // auth.getName() = l'email extrait automatiquement du token JWT par JwtFilter
        String email = auth.getName();
        User user = userService.getUtilisateurParEmail(email);
        return ResponseEntity.ok(user);
    }

    // ================================================================
    // US03 - Modifier son profil
    // PUT /api/utilisateurs/moi
    // Header requis : Authorization: Bearer <token>
    // Body : { "nom": "...", "prenom": "...", "telephone": "..." }
    // ================================================================
    @PutMapping("/moi")
    public ResponseEntity<String> modifierMonProfil(Authentication auth,
                                                     @Valid @RequestBody UpdateProfileRequest request) {
        String email = auth.getName();
        try {
            userService.modifierProfil(email, request);
            return ResponseEntity.ok("Profil mis à jour avec succès !");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ================================================================
    // US04 - Lister tous les utilisateurs (ADMINISTRATEUR uniquement)
    // GET /api/utilisateurs
    // Header requis : Authorization: Bearer <token d'un ADMINISTRATEUR>
    // ================================================================
    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<java.util.List<User>> listerTous() {
        return ResponseEntity.ok(userService.getTousLesUtilisateurs());
    }

    // ================================================================
    // US04 - Voir les demandes de vétérinaires en attente de validation
    // GET /api/utilisateurs/en-attente-validation
    // Header requis : Authorization: Bearer <token d'un ADMINISTRATEUR>
    // ================================================================
    @GetMapping("/en-attente-validation")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<java.util.List<User>> demandesVeterinairesEnAttente() {
        return ResponseEntity.ok(userService.getDemandesVeterinairesEnAttente());
    }

    // ================================================================
    // US04 - Attribuer un rôle (ADMINISTRATEUR uniquement)
    // PUT /api/utilisateurs/{id}/role
    // Header requis : Authorization: Bearer <token d'un ADMINISTRATEUR>
    // Body : { "role": "VETERINAIRE" }
    // ================================================================
    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")  // Double vérification (déjà dans SecurityConfig)
    public ResponseEntity<String> attribuerRole(@PathVariable Long id,
                                                 @Valid @RequestBody AssignRoleRequest request) {
        try {
            userService.attribuerRole(id, request);
            return ResponseEntity.ok("Rôle mis à jour avec succès !");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
