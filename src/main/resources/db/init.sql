-- ============================================================
--  MediVet Connect — VetBookingService
--  Script d'initialisation PostgreSQL
--
--  Tables :
--    vets                 — profils des vétérinaires (1 spécialité par vét)
--    slots                — créneaux horaires
--    appointments         — rendez-vous confirmés
--    waiting_list_entries — liste d'attente FIFO
--
--  Règles métier :
--    RM06 — un seul rendez-vous confirmé par créneau
--    RM07 — le type de consultation doit correspondre à la spécialité du vét
--    RM08 — liste d'attente FIFO, fenêtre d'offre 30 min
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SCHEMA IF NOT EXISTS petpass_schema;

-- ============================================================
--  TABLE : vets
--  Un vétérinaire a exactement UNE spécialité (consultation_type).
-- ============================================================
CREATE TABLE IF NOT EXISTS vets (
    id                BIGSERIAL    PRIMARY KEY,
    first_name        VARCHAR(100) NOT NULL,
    last_name         VARCHAR(100) NOT NULL,
    email             VARCHAR(255) NOT NULL UNIQUE,
    phone             VARCHAR(30),
    clinic_name       VARCHAR(255) NOT NULL,
    address           VARCHAR(255),
    city              VARCHAR(100),
    latitude          DOUBLE PRECISION,
    longitude         DOUBLE PRECISION,
    consultation_type VARCHAR(50)  NOT NULL,
    active            BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT chk_vets_email_format CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$'),
    CONSTRAINT chk_vets_consultation_type CHECK (
        consultation_type IN (
            'GENERAL','SURGERY','DERMATOLOGY','CARDIOLOGY',
            'ORTHOPEDICS','OPHTHALMOLOGY','DENTISTRY','EMERGENCY'
        )
    )
);

COMMENT ON COLUMN vets.consultation_type IS 'Spécialité unique du vétérinaire (RM07).';

CREATE INDEX IF NOT EXISTS idx_vets_city_type
    ON vets (city, consultation_type)
    WHERE active = TRUE;

-- ============================================================
--  TABLE : slots
-- ============================================================
CREATE TABLE IF NOT EXISTS slots (
    id         BIGSERIAL   PRIMARY KEY,
    vet_id     BIGINT      NOT NULL REFERENCES vets(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time   TIMESTAMPTZ NOT NULL,
    status     VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    version    BIGINT      NOT NULL DEFAULT 0,

    CONSTRAINT uq_slot_vet_start   UNIQUE (vet_id, start_time),
    CONSTRAINT chk_slot_status     CHECK  (status IN ('AVAILABLE','BOOKED','BLOCKED')),
    CONSTRAINT chk_slot_time_order CHECK  (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_slots_vet_status
    ON slots (vet_id, status, start_time);

-- ============================================================
--  TABLE : appointments
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
    id                BIGSERIAL   PRIMARY KEY,
    slot_id           BIGINT      NOT NULL UNIQUE REFERENCES slots(id),
    owner_id          BIGINT      NOT NULL,
    pet_id            BIGINT,
    consultation_type VARCHAR(50) NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ,

    CONSTRAINT chk_appt_consultation_type CHECK (
        consultation_type IN (
            'GENERAL','SURGERY','DERMATOLOGY','CARDIOLOGY',
            'ORTHOPEDICS','OPHTHALMOLOGY','DENTISTRY','EMERGENCY'
        )
    ),
    CONSTRAINT chk_appt_status CHECK (
        status IN ('PENDING','CONFIRMED','CANCELLED','LATE_CANCELLED','COMPLETED')
    )
);

CREATE INDEX IF NOT EXISTS idx_appointments_owner ON appointments (owner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_slot  ON appointments (slot_id);

-- ============================================================
--  TABLE : waiting_list_entries
-- ============================================================
CREATE TABLE IF NOT EXISTS waiting_list_entries (
    id                BIGSERIAL   PRIMARY KEY,
    slot_id           BIGINT      NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
    owner_id          BIGINT      NOT NULL,
    pet_id            BIGINT,
    consultation_type VARCHAR(50) NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    registered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    offer_expires_at  TIMESTAMPTZ,

    CONSTRAINT chk_wl_consultation_type CHECK (
        consultation_type IN (
            'GENERAL','SURGERY','DERMATOLOGY','CARDIOLOGY',
            'ORTHOPEDICS','OPHTHALMOLOGY','DENTISTRY','EMERGENCY'
        )
    ),
    CONSTRAINT chk_wl_status    CHECK (status IN ('WAITING','OFFERED','ACCEPTED','EXPIRED','CANCELLED')),
    CONSTRAINT uq_wl_owner_slot UNIQUE (slot_id, owner_id)
);

CREATE INDEX IF NOT EXISTS idx_wl_slot_status_fifo
    ON waiting_list_entries (slot_id, status, registered_at ASC);

CREATE INDEX IF NOT EXISTS idx_wl_offered_expires
    ON waiting_list_entries (status, offer_expires_at)
    WHERE status = 'OFFERED';

-- ============================================================
--  DONNÉES DE DÉMO — idempotent (exécuté seulement si vide)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vets LIMIT 1) THEN

    -- 6 vétérinaires, chacun avec UNE seule spécialité
    INSERT INTO vets (first_name, last_name, email, phone, clinic_name, address, city,
                      latitude, longitude, consultation_type)
    VALUES
      ('Sarah',   'Ben Ali',   'sarah.benali@medivet.tn',    '+21671000001',
       'Clinique Centrale Tunis',     '12 av. Habib Bourguiba',  'Tunis',
       36.8190, 10.1658, 'GENERAL'),

      ('Ahmed',   'Trabelsi',  'ahmed.trabelsi@medivet.tn',  '+21674000002',
       'Cabinet Vétérinaire Sfax',    '5 rue Tahar Sfar',        'Sfax',
       34.7406, 10.7603, 'SURGERY'),

      ('Leila',   'Mansouri',  'leila.mansouri@medivet.tn',  '+21675000003',
       'Clinique Animaux Gabès',      '8 av. de la République',  'Gabès',
       33.8828,  9.9977, 'DERMATOLOGY'),

      ('Karim',   'Hachani',   'karim.hachani@medivet.tn',   '+21673000004',
       'VetCare Sousse',              '22 rue Khaled Ibn El Walid','Sousse',
       35.8245, 10.6346, 'CARDIOLOGY'),

      ('Sana',    'Mrabti',    'sana.mrabti@medivet.tn',     '+21671000005',
       'Clinique Animaux Ariana',     '3 rue des Roses',         'Tunis',
       36.8676, 10.1929, 'OPHTHALMOLOGY'),

      ('Youssef', 'Ben Salah', 'youssef.bensalah@medivet.tn','+21676000006',
       'Cabinet Vétérinaire Bizerte', '15 av. de la Liberté',    'Bizerte',
       37.2746,  9.8739, 'EMERGENCY');

    -- Créneaux : 9 slots × 2 jours × 6 vétérinaires = 108 créneaux
    INSERT INTO slots (vet_id, start_time, end_time, status)
    SELECT
      v.id,
      date_trunc('day', NOW())
        + (d || ' days')::interval
        + (h || ' hours')::interval
        + (m || ' minutes')::interval,
      date_trunc('day', NOW())
        + (d || ' days')::interval
        + (h || ' hours')::interval
        + (m || ' minutes')::interval
        + interval '30 minutes',
      'AVAILABLE'
    FROM vets v
    CROSS JOIN (VALUES (0),(1)) AS days(d)
    CROSS JOIN (
      VALUES (9,0),(9,30),(10,0),(10,30),(11,0),(14,0),(14,30),(15,0),(15,30)
    ) AS times(h, m)
    WHERE v.active = TRUE;

  END IF;
END $$;

-- ============================================================
--  TABLE : notifications  (US17 / RM14)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id                BIGSERIAL    PRIMARY KEY,
    recipient_id      BIGINT       NOT NULL,
    type              VARCHAR(40)  NOT NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'UNREAD',
    message           VARCHAR(500) NOT NULL,
    reference_id      BIGINT,
    idempotency_key   VARCHAR(100) NOT NULL UNIQUE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    read_at           TIMESTAMPTZ,

    CONSTRAINT chk_notif_type CHECK (
        type IN ('APPOINTMENT_CONFIRMED','APPOINTMENT_MODIFIED',
                 'APPOINTMENT_CANCELLED','WAITING_LIST_OFFER')
    ),
    CONSTRAINT chk_notif_status CHECK (
        status IN ('UNREAD','READ','FAILED')
    )
);

COMMENT ON TABLE  notifications IS 'Notifications persistées en DB (US17/RM14).';
COMMENT ON COLUMN notifications.idempotency_key IS
    'Clé unique par événement métier — évite les doublons (RM14).';

CREATE INDEX IF NOT EXISTS idx_notif_recipient
    ON notifications (recipient_id, status);

CREATE INDEX IF NOT EXISTS idx_notif_created
    ON notifications (created_at DESC);
