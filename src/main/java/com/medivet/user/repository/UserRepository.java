package com.medivet.user.repository;

import com.medivet.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Interface de communication avec la table "utilisateurs" en base de données.
 * Spring Data JPA génère automatiquement les requêtes SQL à partir des noms de méthodes.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Cherche un utilisateur par son email (pour la connexion)
    Optional<User> findByEmail(String email);

    // Vérifie si un email existe déjà (pour l'inscription)
    boolean existsByEmail(String email);

    // Cherche un utilisateur via son token de réinitialisation (US05)
    Optional<User> findByTokenReinitialisationMotDePasse(String token);
}
