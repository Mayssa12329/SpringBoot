package com.medivet.user.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entité représentant un utilisateur de la plateforme MEDIVET.
 * Correspond à la table "utilisateurs" en base de données.
 */
@Entity
@Table(name = "utilisateurs")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    // L'email est unique car il sert d'identifiant de connexion
    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String motDePasse;  // Sera stocké hashé (bcrypt)

    @Column(nullable = false)
    private String telephone;

    // Le rôle détermine les permissions de l'utilisateur (US04)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.UTILISATEUR;  // Par défaut : UTILISATEUR

    // Token temporaire pour la récupération de mot de passe (US05)
    @Column
    private String tokenReinitialisationMotDePasse;

    @Column
    private LocalDateTime expirationTokenReinitialisation;

    // Champs pour l'inscription professionnelle (Vétérinaire)
    @Column
    private String diplomeUrl; // Chemin vers l'image du diplôme

    @Column(nullable = false)
    private Boolean demandeVeterinaire = false; // Indique si l'utilisateur attend la validation admin

    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    // ==================== Getters & Setters ====================

    public Long getId() { return id; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMotDePasse() { return motDePasse; }
    public void setMotDePasse(String motDePasse) { this.motDePasse = motDePasse; }

    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getTokenReinitialisationMotDePasse() { return tokenReinitialisationMotDePasse; }
    public void setTokenReinitialisationMotDePasse(String token) { this.tokenReinitialisationMotDePasse = token; }

    public LocalDateTime getExpirationTokenReinitialisation() { return expirationTokenReinitialisation; }
    public void setExpirationTokenReinitialisation(LocalDateTime expiration) { this.expirationTokenReinitialisation = expiration; }

    public String getDiplomeUrl() { return diplomeUrl; }
    public void setDiplomeUrl(String diplomeUrl) { this.diplomeUrl = diplomeUrl; }

    public Boolean getDemandeVeterinaire() { return demandeVeterinaire; }
    public void setDemandeVeterinaire(Boolean demandeVeterinaire) { this.demandeVeterinaire = demandeVeterinaire; }

    public LocalDateTime getDateCreation() { return dateCreation; }
}
