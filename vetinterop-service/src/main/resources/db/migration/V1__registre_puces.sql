-- Registre des puces (RM10). statut : VERIFIE | INCOHERENT | INDETERMINE
CREATE TABLE registre_puce (
    puce        VARCHAR(15)  PRIMARY KEY,
    nom_animal  VARCHAR(100),
    espece      VARCHAR(50),
    statut      VARCHAR(20)  NOT NULL,
    message     VARCHAR(255),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_registre_statut CHECK (statut IN ('VERIFIE', 'INCOHERENT', 'INDETERMINE'))
);

-- Jeu de données de démonstration
INSERT INTO registre_puce (puce, nom_animal, espece, statut, message) VALUES
    ('250268500123456', 'Rex',  'CHIEN', 'VERIFIE',     'Identité confirmée'),
    ('250268500123457', 'Mina', 'CHAT',  'VERIFIE',     'Identité confirmée'),
    ('250268500999001', 'Kiko', 'CHIEN', 'INCOHERENT',  'Espèce déclarée différente de celle du registre'),
    ('250268500999002', 'Luna', 'CHAT',  'INDETERMINE', 'Dossier en cours de vérification par le vétérinaire');
