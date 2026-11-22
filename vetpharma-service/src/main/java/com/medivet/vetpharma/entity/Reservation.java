package com.medivet.vetpharma.entity;

import com.medivet.vetpharma.enums.StatutReservation;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservation")
public class Reservation {

    /** TTL d'une réservation EN_ATTENTE (RM11). */
    public static final int TTL_MINUTES = 15;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reservationId;

    /** Clé d'idempotence fournie par le client (UUID). RM11. */
    @Column(nullable = false, unique = true, length = 64)
    private String idempotencyKey;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pharmacie_id", nullable = false)
    private Pharmacie pharmacie;

    @Column(nullable = false)
    private int quantite;

    @Column(nullable = false, length = 100)
    private String patientId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutReservation statut;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime expirationAt;

    protected Reservation() {}

    public Reservation(String idempotencyKey,
                       Produit produit,
                       Pharmacie pharmacie,
                       int quantite,
                       String patientId) {
        this.idempotencyKey = idempotencyKey;
        this.produit        = produit;
        this.pharmacie      = pharmacie;
        this.quantite       = quantite;
        this.patientId      = patientId;
        this.statut         = StatutReservation.EN_ATTENTE;
        this.createdAt      = LocalDateTime.now();
        this.expirationAt   = this.createdAt.plusMinutes(TTL_MINUTES);
    }

    // ── Transitions d'état ────────────────────────────────────────────────

    public void confirmer() {
        this.statut = StatutReservation.CONFIRMEE;
    }

    public void annuler() {
        this.statut = StatutReservation.ANNULEE;
    }

    public void expirer() {
        this.statut = StatutReservation.EXPIREE;
    }

    public boolean estExpiree() {
        return LocalDateTime.now().isAfter(expirationAt);
    }

    // ── Accesseurs ────────────────────────────────────────────────────────
    public Long              getReservationId()  { return reservationId; }
    public String            getIdempotencyKey() { return idempotencyKey; }
    public Produit           getProduit()        { return produit; }
    public Pharmacie         getPharmacie()      { return pharmacie; }
    public int               getQuantite()       { return quantite; }
    public String            getPatientId()      { return patientId; }
    public StatutReservation getStatut()         { return statut; }
    public LocalDateTime     getCreatedAt()      { return createdAt; }
    public LocalDateTime     getExpirationAt()   { return expirationAt; }
}
