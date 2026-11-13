package com.medivet.user.dto;

/**
 * US02 - Réponse renvoyée après une connexion réussie.
 * Contient le token JWT que le frontend doit stocker et envoyer à chaque requête.
 */
public class LoginResponse {

    private Long id;
    private String token;       // Le token JWT
    private String email;
    private String role;        // Le rôle de l'utilisateur (pour affichage côté frontend)
    private String nom;
    private String prenom;
    private Boolean demandeVeterinaire;
    private String diplomeUrl;

    public LoginResponse(Long id, String token, String email, String role, String nom, String prenom, Boolean demandeVeterinaire, String diplomeUrl) {
        this.id = id;
        this.token = token;
        this.email = email;
        this.role = role;
        this.nom = nom;
        this.prenom = prenom;
        this.demandeVeterinaire = demandeVeterinaire;
        this.diplomeUrl = diplomeUrl;
    }

    // Getters
    public Long getId() { return id; }
    public String getToken() { return token; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getNom() { return nom; }
    public String getPrenom() { return prenom; }
    public Boolean getDemandeVeterinaire() { return demandeVeterinaire; }
    public String getDiplomeUrl() { return diplomeUrl; }
}
