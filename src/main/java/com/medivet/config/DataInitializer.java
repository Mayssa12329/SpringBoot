package com.medivet.config;

import com.medivet.user.model.Role;
import com.medivet.user.model.User;
import com.medivet.user.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * S'exécute automatiquement au démarrage de l'application.
 * Crée un compte ADMINISTRATEUR par défaut s'il n'existe pas encore.
 *
 * Email    : admin@medivet.com
 * Mot de passe : Admin1234!
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Crée l'admin uniquement s'il n'existe pas déjà en BDD
        if (!userRepository.existsByEmail("admin@medivet.com")) {
            User admin = new User();
            admin.setNom("Admin");
            admin.setPrenom("MEDIVET");
            admin.setEmail("admin@medivet.com");
            admin.setMotDePasse(passwordEncoder.encode("Admin1234!"));
            admin.setTelephone("0000000000");
            admin.setRole(Role.ADMINISTRATEUR);

            userRepository.save(admin);
            System.out.println(">>> Compte administrateur créé : admin@medivet.com / Admin1234!");
        }
    }
}
