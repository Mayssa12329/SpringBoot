-- ============================================================
-- Base de données : petpass_db (Microservice PetPass)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS animals (
    id SERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    birth_date DATE,
    gender VARCHAR(10),
    weight DOUBLE PRECISION,
    microchip_id VARCHAR(15) UNIQUE,
    photo_url VARCHAR(500),
    description TEXT,
    is_sterilized BOOLEAN DEFAULT FALSE,
    vaccination_status VARCHAR(50),
    health_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medical_records (
    id SERIAL PRIMARY KEY,
    animal_id BIGINT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    veterinarian_id BIGINT,
    veterinarian_name VARCHAR(255),
    consultation_date TIMESTAMP NOT NULL,
    diagnosis TEXT NOT NULL,
    treatment TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS vaccinations (
    id SERIAL PRIMARY KEY,
    animal_id BIGINT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    vaccine_name VARCHAR(100) NOT NULL,
    administered_date DATE NOT NULL,
    due_date DATE,
    batch_number VARCHAR(100),
    veterinarian_id BIGINT
);

CREATE TABLE IF NOT EXISTS vet_authorizations (
    id SERIAL PRIMARY KEY,
    animal_id BIGINT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    veterinarian_id BIGINT NOT NULL,
    veterinarian_name VARCHAR(255),
    granted_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Actif'
);
