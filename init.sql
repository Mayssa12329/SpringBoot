-- ============================================================
-- MEDIVET - Script d'initialisation de la base de données
-- PostgreSQL
-- ============================================================
-- Ce fichier est exécuté automatiquement par Docker au premier
-- démarrage du conteneur PostgreSQL (via le volume init.sql).
-- ============================================================

-- ============================================================
-- TABLE : utilisateurs
-- Correspond à l'entité User.java
-- US01 : Créer un compte
-- US02 : Se connecter
-- US03 : Modifier son profil
-- US04 : Attribuer des rôles
-- US05 : Récupérer son mot de passe
-- ============================================================
CREATE TABLE IF NOT EXISTS utilisateurs (
    id                                      SERIAL PRIMARY KEY,
    nom                                     VARCHAR(100)    NOT NULL,
    prenom                                  VARCHAR(100)    NOT NULL,
    email                                   VARCHAR(255)    NOT NULL UNIQUE,
    mot_de_passe                            VARCHAR(255)    NOT NULL,   -- stocké hashé (BCrypt)
    telephone                               VARCHAR(20)     NOT NULL,
    role                                    VARCHAR(50)     NOT NULL DEFAULT 'UTILISATEUR',
                                            -- Valeurs possibles : UTILISATEUR, VETERINAIRE, ADMINISTRATEUR

    -- Champs pour la réinitialisation du mot de passe (US05)
    token_reinitialisation_mot_de_passe     VARCHAR(255),              -- token UUID temporaire
    expiration_token_reinitialisation       TIMESTAMP,                 -- expiration dans 1h

    date_creation                           TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Index sur l'email pour accélérer les recherches de connexion
CREATE INDEX IF NOT EXISTS idx_utilisateurs_email
    ON utilisateurs(email);

-- Index sur le token de réinitialisation
CREATE INDEX IF NOT EXISTS idx_utilisateurs_token_reinitialisation
    ON utilisateurs(token_reinitialisation_mot_de_passe);


-- ============================================================
-- DONNÉES INITIALES : Compte Administrateur par défaut
-- Email    : admin@medivet.com
-- Mot de passe : Admin1234!
-- (hashé avec BCrypt - généré avec passwordEncoder.encode("Admin1234!"))
-- ============================================================
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, role)
VALUES (
    'Admin',
    'MEDIVET',
    'admin@medivet.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    '0000000000',
    'ADMINISTRATEUR'
)
ON CONFLICT (email) DO NOTHING;  -- Ne recrée pas si déjà existant


-- ============================================================
-- VÉRIFICATION : affiche les tables créées dans les logs Docker
-- ============================================================
SELECT 'Table utilisateurs créée avec succès !' AS message;
