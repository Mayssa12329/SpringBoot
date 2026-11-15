package com.medivet.authentification.user.controller;

import com.medivet.authentification.user.dto.AssignRoleRequest;
import com.medivet.authentification.user.dto.UpdateProfileRequest;
import com.medivet.authentification.user.model.User;
import com.medivet.authentification.user.service.UserService;
import com.medivet.petpass.dto.response.AnimalResponse;
import com.medivet.petpass.service.AnimalService;
import com.medivet.vetbooking.dto.response.AppointmentResponse;
import com.medivet.vetbooking.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

/**
 * Controller pour les routes utilisateur (token JWT requis).
 * Relie les fonctionnalités Utilisateurs avec PetPass (animaux) et VetBooking (rendez-vous).
 */
@RestController
@RequestMapping("/api/utilisateurs")
public class UserController {

    private final UserService userService;

    @Autowired(required = false)
    private AnimalService animalService;

    @Autowired(required = false)
    private AppointmentService appointmentService;

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
        String email = auth.getName();
        User user = userService.getUtilisateurParEmail(email);
        return ResponseEntity.ok(user);
    }

    // ================================================================
    // Liaison PetPass : Voir les animaux de l'utilisateur connecté
    // GET /api/utilisateurs/moi/animaux
    // ================================================================
    @GetMapping("/moi/animaux")
    public ResponseEntity<List<AnimalResponse>> mesAnimaux(Authentication auth) {
        String email = auth.getName();
        User user = userService.getUtilisateurParEmail(email);
        if (animalService != null) {
            return ResponseEntity.ok(animalService.getAnimalsByOwner(user.getId()));
        }
        return ResponseEntity.ok(Collections.emptyList());
    }

    // ================================================================
    // Liaison VetBooking : Voir les rendez-vous de l'utilisateur connecté
    // GET /api/utilisateurs/moi/rendez-vous
    // ================================================================
    @GetMapping("/moi/rendez-vous")
    public ResponseEntity<List<AppointmentResponse>> mesRendezVous(Authentication auth) {
        String email = auth.getName();
        User user = userService.getUtilisateurParEmail(email);
        if (appointmentService != null) {
            return ResponseEntity.ok(appointmentService.getByOwner(user.getId()));
        }
        return ResponseEntity.ok(Collections.emptyList());
    }

    // ================================================================
    // US03 - Modifier son profil
    // PUT /api/utilisateurs/moi
    // ================================================================
    @PutMapping("/moi")
    public ResponseEntity<String> modifierMonProfil(Authentication auth,
                                                     @Valid @RequestBody UpdateProfileRequest request) {
        String email = auth.getName();
        userService.modifierProfil(email, request);
        return ResponseEntity.ok("Profil mis à jour avec succès !");
    }

    // ================================================================
    // US04 - Lister tous les utilisateurs (ADMINISTRATEUR uniquement)
    // GET /api/utilisateurs
    // ================================================================
    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<List<User>> listerTous() {
        return ResponseEntity.ok(userService.getTousLesUtilisateurs());
    }

    // ================================================================
    // US04 - Voir les demandes de vétérinaires en attente de validation
    // GET /api/utilisateurs/en-attente-validation
    // ================================================================
    @GetMapping("/en-attente-validation")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<List<User>> demandesVeterinairesEnAttente() {
        return ResponseEntity.ok(userService.getDemandesVeterinairesEnAttente());
    }

    // ================================================================
    // US04 - Attribuer un rôle (ADMINISTRATEUR uniquement)
    // PUT /api/utilisateurs/{id}/role
    // ================================================================
    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<String> attribuerRole(@PathVariable Long id,
                                                 @Valid @RequestBody AssignRoleRequest request) {
        userService.attribuerRole(id, request);
        return ResponseEntity.ok("Rôle mis à jour avec succès !");
    }
}
