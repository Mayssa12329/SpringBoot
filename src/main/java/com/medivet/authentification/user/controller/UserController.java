package com.medivet.authentification.user.controller;

import com.medivet.authentification.user.dto.AssignRoleRequest;
import com.medivet.authentification.user.dto.UpdateProfileRequest;
import com.medivet.authentification.user.model.User;
import com.medivet.authentification.user.service.UserService;
import com.medivet.petpass.dto.response.AnimalResponse;
import com.medivet.petpass.service.AnimalService;
import com.medivet.vetbooking.dto.response.AppointmentResponse;
import com.medivet.vetbooking.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "1. Utilisateurs & Profils", description = "Gestion du profil, liaisons inter-services et administration (US03, US04)")
@SecurityRequirement(name = "BearerAuth")
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
    @Operation(summary = "Consulter son propre profil (US03)", description = "Retourne les informations du compte utilisateur connecté via son JWT")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profil utilisateur retourné"),
            @ApiResponse(responseCode = "401", description = "Non authentifié (Token JWT absent ou invalide)")
    })
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
    @Operation(summary = "Lister mes animaux enregistrés (Liaison PetPass)", description = "Récupère automatiquement la liste des animaux de l'utilisateur connecté sans passer d'ID")
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
    @Operation(summary = "Lister mes rendez-vous (Liaison VetBooking)", description = "Récupère automatiquement l'historique des consultations prises par l'utilisateur connecté")
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
    @Operation(summary = "Modifier son profil (US03)", description = "Met à jour le nom, prénom ou téléphone de l'utilisateur connecté")
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
    @Operation(summary = "Lister tous les utilisateurs (Admin)", description = "Accessible uniquement par un utilisateur ayant le rôle ADMINISTRATEUR")
    public ResponseEntity<List<User>> listerTous() {
        return ResponseEntity.ok(userService.getTousLesUtilisateurs());
    }

    // ================================================================
    // US04 - Voir les demandes de vétérinaires en attente de validation
    // GET /api/utilisateurs/en-attente-validation
    // ================================================================
    @GetMapping("/en-attente-validation")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    @Operation(summary = "Consulter les candidatures vétérinaires en attente (Admin)", description = "Liste les professionnels inscrits dont le diplôme doit être validé")
    public ResponseEntity<List<User>> demandesVeterinairesEnAttente() {
        return ResponseEntity.ok(userService.getDemandesVeterinairesEnAttente());
    }

    // ================================================================
    // US04 - Attribuer un rôle (ADMINISTRATEUR uniquement)
    // PUT /api/utilisateurs/{id}/role
    // ================================================================
    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    @Operation(summary = "Attribuer un rôle à un utilisateur (Admin)", description = "Permet à l'admin de promouvoir un utilisateur (ex: valider le rôle VETERINAIRE)")
    public ResponseEntity<String> attribuerRole(@PathVariable Long id,
                                                 @Valid @RequestBody AssignRoleRequest request) {
        userService.attribuerRole(id, request);
        return ResponseEntity.ok("Rôle mis à jour avec succès !");
    }
}
