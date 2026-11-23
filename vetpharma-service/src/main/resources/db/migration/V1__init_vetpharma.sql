-- ============================================================
-- VetPharma – schéma initial (Flyway V1)
-- ============================================================

-- ── Pharmacies ──────────────────────────────────────────────
CREATE TABLE pharmacie (
    pharmacie_id BIGSERIAL    PRIMARY KEY,
    nom          VARCHAR(150) NOT NULL,
    adresse      VARCHAR(255) NOT NULL,
    ville        VARCHAR(100) NOT NULL,
    telephone    VARCHAR(20)
);

-- ── Produits médicamenteux ───────────────────────────────────
CREATE TABLE produit (
    produit_id  BIGSERIAL    PRIMARY KEY,
    nom         VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    categorie   VARCHAR(100) NOT NULL,
    unite       VARCHAR(30)  NOT NULL   -- mg | ml | comprimé ...
);

-- ── Stocks (1 ligne = 1 produit dans 1 pharmacie) ───────────
CREATE TABLE stock (
    stock_id      BIGSERIAL   PRIMARY KEY,
    produit_id    BIGINT      NOT NULL REFERENCES produit(produit_id),
    pharmacie_id  BIGINT      NOT NULL REFERENCES pharmacie(pharmacie_id),
    quantite_dispo INT        NOT NULL DEFAULT 0 CHECK (quantite_dispo >= 0),
    statut        VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE'
                              CHECK (statut IN ('DISPONIBLE','FAIBLE','RUPTURE')),
    UNIQUE (produit_id, pharmacie_id)
);

-- ── Réservations (TTL 15 min, idempotence via idempotency_key) ──
CREATE TABLE reservation (
    reservation_id  BIGSERIAL    PRIMARY KEY,
    idempotency_key VARCHAR(64)  NOT NULL UNIQUE,   -- RM11 : déduplique les requêtes
    produit_id      BIGINT       NOT NULL REFERENCES produit(produit_id),
    pharmacie_id    BIGINT       NOT NULL REFERENCES pharmacie(pharmacie_id),
    quantite        INT          NOT NULL CHECK (quantite > 0),
    patient_id      VARCHAR(100) NOT NULL,
    statut          VARCHAR(20)  NOT NULL DEFAULT 'EN_ATTENTE'
                                 CHECK (statut IN ('EN_ATTENTE','CONFIRMEE','ANNULEE','EXPIREE')),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    expiration_at   TIMESTAMP    NOT NULL           -- created_at + 15 min
);

-- Index pour la purge des réservations expirées
CREATE INDEX idx_reservation_expiration ON reservation (expiration_at)
    WHERE statut = 'EN_ATTENTE';

-- ── Données de démonstration ─────────────────────────────────
INSERT INTO pharmacie (nom, adresse, ville, telephone) VALUES
    ('PharmaVet Tunis',   '12 Av. Habib Bourguiba', 'Tunis',   '71 000 001'),
    ('PharmaVet Sfax',    '5 Rue de la Liberté',    'Sfax',    '74 000 002'),
    ('PharmaVet Sousse',  '8 Blvd du 7 Novembre',   'Sousse',  '73 000 003');

INSERT INTO produit (nom, description, categorie, unite) VALUES
    ('Amoxicilline 500mg', 'Antibiotique à large spectre', 'Antibiotique', 'comprimé'),
    ('Ibuprofène vét 200mg','Anti-inflammatoire AINS',      'AINS',         'comprimé'),
    ('Sérum physiologique','Solution NaCl 0,9 %',          'Perfusion',    'ml'),
    ('Vaccin Rage',        'Vaccin antirabique homologué', 'Vaccin',       'dose');

-- Stocks initiaux
INSERT INTO stock (produit_id, pharmacie_id, quantite_dispo, statut) VALUES
    (1, 1, 200, 'DISPONIBLE'),
    (1, 2,  15, 'FAIBLE'),
    (2, 1, 100, 'DISPONIBLE'),
    (2, 3,   0, 'RUPTURE'),
    (3, 1, 500, 'DISPONIBLE'),
    (4, 1,  50, 'DISPONIBLE'),
    (4, 2,   8, 'FAIBLE');
