package com.medivet.vetinterop.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "registre_puce")
public class PuceRegistre {

    @Id
    @Column(length = 15)
    private String puce;

    @Column(name = "nom_animal", length = 100)
    private String nomAnimal;

    @Column(length = 50)
    private String espece;

    /** VERIFIE | INCOHERENT | INDETERMINE */
    @Column(nullable = false, length = 20)
    private String statut;

    @Column(length = 255)
    private String message;

    protected PuceRegistre() {
    }

    public PuceRegistre(String puce, String nomAnimal, String espece, String statut, String message) {
        this.puce = puce;
        this.nomAnimal = nomAnimal;
        this.espece = espece;
        this.statut = statut;
        this.message = message;
    }

    public String getPuce() { return puce; }
    public String getNomAnimal() { return nomAnimal; }
    public String getEspece() { return espece; }
    public String getStatut() { return statut; }
    public String getMessage() { return message; }
}
