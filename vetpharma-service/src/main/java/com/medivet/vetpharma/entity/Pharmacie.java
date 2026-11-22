package com.medivet.vetpharma.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "pharmacie")
public class Pharmacie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long pharmacieId;

    @Column(nullable = false, length = 150)
    private String nom;

    @Column(nullable = false, length = 255)
    private String adresse;

    @Column(nullable = false, length = 100)
    private String ville;

    @Column(length = 20)
    private String telephone;

    protected Pharmacie() {}

    public Pharmacie(String nom, String adresse, String ville, String telephone) {
        this.nom       = nom;
        this.adresse   = adresse;
        this.ville     = ville;
        this.telephone = telephone;
    }

    public Long   getPharmacieId() { return pharmacieId; }
    public String getNom()         { return nom; }
    public String getAdresse()     { return adresse; }
    public String getVille()       { return ville; }
    public String getTelephone()   { return telephone; }
}
