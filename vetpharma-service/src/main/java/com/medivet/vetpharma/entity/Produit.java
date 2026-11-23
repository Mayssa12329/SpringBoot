package com.medivet.vetpharma.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "produit")
public class Produit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long produitId;

    @Column(nullable = false, length = 150)
    private String nom;

    @Column(length = 500)
    private String description;

    @Column(nullable = false, length = 100)
    private String categorie;

    @Column(nullable = false, length = 30)
    private String unite;   // mg | ml | comprimé | dose …

    protected Produit() {}

    public Produit(String nom, String description, String categorie, String unite) {
        this.nom         = nom;
        this.description = description;
        this.categorie   = categorie;
        this.unite       = unite;
    }

    // ── Mutation US33 ─────────────────────────────────────────────────────

    /** Met à jour tous les champs modifiables du produit (US33 – ModifierProduit). */
    public void mettreAJour(String nom, String description, String categorie, String unite) {
        this.nom         = nom;
        this.description = description;
        this.categorie   = categorie;
        this.unite       = unite;
    }

    // ── Accesseurs ────────────────────────────────────────────────────────
    public Long   getProduitId()   { return produitId; }
    public String getNom()         { return nom; }
    public String getDescription() { return description; }
    public String getCategorie()   { return categorie; }
    public String getUnite()       { return unite; }
}
