CREATE TABLE annonce (
    id            BIGSERIAL PRIMARY KEY,
    animal_id     BIGINT        NOT NULL,            -- référence logique vers PetPass
    puce          VARCHAR(15)   NOT NULL,
    nom           VARCHAR(100)  NOT NULL,
    espece        VARCHAR(50)   NOT NULL,
    age_estime    INT,
    localisation  VARCHAR(150),
    description   VARCHAR(1000),
    photo_url     VARCHAR(500),
    refuge_id     BIGINT        NOT NULL,            -- référence logique vers UserService
    statut        VARCHAR(30)   NOT NULL,            -- VERIFICATION_EN_ATTENTE, ACTIVE, CLOTUREE, MASQUEE
    version       BIGINT        NOT NULL DEFAULT 0,  -- verrou optimiste
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_annonce_statut ON annonce(statut);

CREATE TABLE candidature (
    id           BIGSERIAL PRIMARY KEY,
    annonce_id   BIGINT       NOT NULL REFERENCES annonce(id),
    candidat_id  BIGINT       NOT NULL,
    statut       VARCHAR(20)  NOT NULL DEFAULT 'SOUMISE',   -- SOUMISE, EN_EXAMEN, ACCEPTEE, REFUSEE
    commentaire  VARCHAR(500),
    version      BIGINT       NOT NULL DEFAULT 0,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);
-- une seule candidature active par candidat et par annonce (RM12)
CREATE UNIQUE INDEX uq_candidature_active
    ON candidature(annonce_id, candidat_id)
    WHERE statut IN ('SOUMISE', 'EN_EXAMEN');

CREATE TABLE rencontre (
    id              BIGSERIAL PRIMARY KEY,
    candidature_id  BIGINT       NOT NULL REFERENCES candidature(id),
    date_rencontre  TIMESTAMP    NOT NULL,
    statut          VARCHAR(20)  NOT NULL DEFAULT 'PLANIFIEE'  -- PLANIFIEE, EFFECTUEE, ANNULEE
);

-- une seule adoption finalisée par annonce, garantie par la base (RM12)
CREATE TABLE adoption (
    id              BIGSERIAL PRIMARY KEY,
    annonce_id      BIGINT     NOT NULL UNIQUE REFERENCES annonce(id),
    candidature_id  BIGINT     NOT NULL REFERENCES candidature(id),
    finalisee_le    TIMESTAMP  NOT NULL DEFAULT NOW()
);

CREATE TABLE decision_historique (
    id          BIGSERIAL PRIMARY KEY,
    entite      VARCHAR(30)  NOT NULL,
    entite_id   BIGINT       NOT NULL,
    decision    VARCHAR(60)  NOT NULL,
    acteur_id   BIGINT,
    motif       VARCHAR(500),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_decision_entite ON decision_historique(entite, entite_id);
