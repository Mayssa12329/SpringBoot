package com.medivet.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * US05 - Étape 1 : L'utilisateur envoie son email pour demander un reset de mot de passe.
 * Le backend va générer un token et envoyer un email.
 */
public class ForgotPasswordRequest {

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    // Getter & Setter
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
