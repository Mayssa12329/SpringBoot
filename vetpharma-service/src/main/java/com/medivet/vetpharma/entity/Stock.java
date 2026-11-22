package com.medivet.vetpharma.entity;

import com.medivet.vetpharma.enums.StatutStock;
import jakarta.persistence.*;

@Entity
@Table(name = "stock",
       uniqueConstraints = @UniqueConstraint(columnNames = {"produit_id", "pharmacie_id"}))
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long stockId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pharmacie_id", nullable = false)
    private Pharmacie pharmacie;

    @Column(nullable = false)
    private int quantiteDispo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutStock statut;

    protected Stock() {}

    public Stock(Produit produit, Pharmacie pharmacie, int quantiteDispo) {
        this.produit       = produit;
        this.pharmacie     = pharmacie;
        this.quantiteDispo = quantiteDispo;
        this.statut        = calculerStatut(quantiteDispo);
    }

    // ── Logique métier ────────────────────────────────────────────────────

    /**
     * Décrémente le stock de {@code qte} unités (réservation).
     * Lève une exception si le stock est insuffisant.
     */
    public void reserver(int qte) {
        if (qte > quantiteDispo) {
            throw new IllegalStateException(
                "Stock insuffisant : demandé=" + qte + ", disponible=" + quantiteDispo);
        }
        this.quantiteDispo -= qte;
        this.statut = calculerStatut(this.quantiteDispo);
    }

    /** Restitue {@code qte} unités (annulation / expiration). */
    public void liberer(int qte) {
        this.quantiteDispo += qte;
        this.statut = calculerStatut(this.quantiteDispo);
    }

    /**
     * Remplace la quantité par une valeur absolue déclarée par la pharmacie (US34).
     * Utilisé lors d'un réapprovisionnement ou d'une correction d'inventaire.
     */
    public void mettreAJourQuantite(int nouvelleQuantite) {
        if (nouvelleQuantite < 0) {
            throw new IllegalArgumentException("La quantité ne peut pas être négative.");
        }
        this.quantiteDispo = nouvelleQuantite;
        this.statut = calculerStatut(this.quantiteDispo);
    }

    private static StatutStock calculerStatut(int qte) {
        if (qte == 0)   return StatutStock.RUPTURE;
        if (qte <= 10)  return StatutStock.FAIBLE;
        return StatutStock.DISPONIBLE;
    }

    // ── Accesseurs ────────────────────────────────────────────────────────
    public Long        getStockId()       { return stockId; }
    public Produit     getProduit()       { return produit; }
    public Pharmacie   getPharmacie()     { return pharmacie; }
    public int         getQuantiteDispo() { return quantiteDispo; }
    public StatutStock getStatut()        { return statut; }
}
