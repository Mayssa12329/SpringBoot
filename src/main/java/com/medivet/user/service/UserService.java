package com.medivet.user.service;

import com.medivet.security.JwtUtil;
import com.medivet.user.dto.*;
import com.medivet.user.model.Role;
import com.medivet.user.model.User;
import com.medivet.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service contenant toute la logique métier liée aux utilisateurs.
 * Les controllers appellent ce service, qui lui-même appelle le repository.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    private static final String UPLOAD_DIR = "uploads/diplomes";

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    // ================================================================
    // US01 - Créer un compte utilisateur normal (propriétaire d'animaux)
    // ================================================================
    public void inscrire(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Un compte avec cet email existe déjà");
        }

        User user = new User();
        user.setNom(request.getNom());
        user.setPrenom(request.getPrenom());
        user.setEmail(request.getEmail());
        user.setTelephone(request.getTelephone());
        user.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
        user.setRole(Role.UTILISATEUR);
        user.setDemandeVeterinaire(false);

        userRepository.save(user);
    }

    // ================================================================
    // US01 - Inscription professionnelle (Vétérinaire avec Diplôme)
    // Règle métier : l'utilisateur s'inscrit, téléverse son diplôme,
    // commence comme simple UTILISATEUR en attendant la validation de l'Admin.
    // ================================================================
    public void inscrireProfessionnel(String nom, String prenom, String email,
                                     String motDePasse, String telephone,
                                     MultipartFile diplome) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Un compte avec cet email existe déjà");
        }

        if (diplome == null || diplome.isEmpty()) {
            throw new RuntimeException("Le diplôme ou justificatif professionnel est obligatoire");
        }

        String diplomeUrl = enregistrerFichierDiplome(diplome);

        User user = new User();
        user.setNom(nom);
        user.setPrenom(prenom);
        user.setEmail(email);
        user.setTelephone(telephone);
        user.setMotDePasse(passwordEncoder.encode(motDePasse));
        // Commence comme simple UTILISATEUR selon la spécification
        user.setRole(Role.UTILISATEUR);
        user.setDemandeVeterinaire(true); // En attente de validation
        user.setDiplomeUrl(diplomeUrl);

        userRepository.save(user);
    }

    private String enregistrerFichierDiplome(MultipartFile file) {
        try {
            Path repertoire = Paths.get(UPLOAD_DIR);
            if (!Files.exists(repertoire)) {
                Files.createDirectories(repertoire);
            }

            // Générer un nom de fichier unique et sécurisé
            String extension = "";
            String nomOriginal = file.getOriginalFilename();
            if (nomOriginal != null && nomOriginal.contains(".")) {
                extension = nomOriginal.substring(nomOriginal.lastIndexOf("."));
            }
            String nomFichierUnique = UUID.randomUUID().toString() + extension;

            Path cheminComplet = repertoire.resolve(nomFichierUnique);
            Files.copy(file.getInputStream(), cheminComplet, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/diplomes/" + nomFichierUnique;
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de l'enregistrement du diplôme : " + e.getMessage());
        }
    }

    // ================================================================
    // US02 - Se connecter (Tous utilisateurs : normal, pro, admin)
    // ================================================================
    public LoginResponse connecter(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email ou mot de passe incorrect"));

        boolean motDePasseCorrect = passwordEncoder.matches(request.getMotDePasse(), user.getMotDePasse());
        if (!motDePasseCorrect) {
            throw new RuntimeException("Email ou mot de passe incorrect");
        }

        String token = jwtUtil.genererToken(user.getEmail());

        return new LoginResponse(
                user.getId(),
                token,
                user.getEmail(),
                user.getRole().name(),
                user.getNom(),
                user.getPrenom(),
                user.getDemandeVeterinaire(),
                user.getDiplomeUrl()
        );
    }

    // ================================================================
    // US03 - Modifier son profil
    // ================================================================
    public void modifierProfil(String emailConnecte, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(emailConnecte)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        user.setNom(request.getNom());
        user.setPrenom(request.getPrenom());
        user.setTelephone(request.getTelephone());

        userRepository.save(user);
    }

    // ================================================================
    // US04 - Attribuer des rôles (ADMIN seulement)
    // ================================================================
    public void attribuerRole(Long userId, AssignRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'ID : " + userId));

        user.setRole(request.getRole());
        // Si l'admin valide le rôle VETERINAIRE, la demande est marquée traitée
        if (request.getRole() == Role.VETERINAIRE) {
            user.setDemandeVeterinaire(false);
        }
        userRepository.save(user);
    }

    // ================================================================
    // US05 - Récupérer son mot de passe
    // ================================================================
    public String demanderReinitialisationMotDePasse(ForgotPasswordRequest request) {
        return userRepository.findByEmail(request.getEmail())
                .map(user -> {
            String token = UUID.randomUUID().toString();
            user.setTokenReinitialisationMotDePasse(token);
            user.setExpirationTokenReinitialisation(LocalDateTime.now().plusHours(1));
            userRepository.save(user);
            return token;
        }).orElse(null);
    }

    public void reinitialiserMotDePasse(ResetPasswordRequest request) {
        User user = userRepository.findByTokenReinitialisationMotDePasse(request.getToken())
                .orElseThrow(() -> new RuntimeException("Token invalide ou déjà utilisé"));

        if (user.getExpirationTokenReinitialisation().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Le token a expiré. Veuillez refaire une demande.");
        }

        user.setMotDePasse(passwordEncoder.encode(request.getNouveauMotDePasse()));
        user.setTokenReinitialisationMotDePasse(null);
        user.setExpirationTokenReinitialisation(null);

        userRepository.save(user);
    }

    // ================================================================
    // Utilitaires de recherche & Administration
    // ================================================================
    public User getUtilisateurParEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    public List<User> getTousLesUtilisateurs() {
        return userRepository.findAll();
    }

    public List<User> getDemandesVeterinairesEnAttente() {
        return userRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getDemandeVeterinaire()) && u.getRole() != Role.VETERINAIRE)
                .toList();
    }
}
