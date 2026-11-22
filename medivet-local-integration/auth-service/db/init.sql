-- ============================================================
-- Base de données : auth_db (Microservice Authentification)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    telephone VARCHAR(30),
    role VARCHAR(50) NOT NULL DEFAULT 'UTILISATEUR',
    demande_veterinaire BOOLEAN DEFAULT FALSE,
    diplome_url VARCHAR(500),
    token_reinitialisation_mot_de_passe VARCHAR(255),
    expiration_token_reinitialisation TIMESTAMP
);
