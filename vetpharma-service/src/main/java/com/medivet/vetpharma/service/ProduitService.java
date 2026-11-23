package com.medivet.vetpharma.service;

import com.medivet.vetpharma.entity.Produit;
import com.medivet.vetpharma.exception.ResourceNotFoundException;
import com.medivet.vetpharma.repository.ProduitRepository;
import com.medivet.vetpharma.repository.StockRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ProduitService {

    private final ProduitRepository repo;
    private final StockRepository   stockRepo;

    public ProduitService(ProduitRepository repo, StockRepository stockRepo) {
        this.repo      = repo;
        this.stockRepo = stockRepo;
    }

    // ── Lecture ───────────────────────────────────────────────────────────

    public List<Produit> listerTous() {
        return repo.findAll();
    }

    public List<Produit> listerParCategorie(String categorie) {
        if (categorie == null || categorie.isBlank()) return listerTous();
        return repo.findByCategorieIgnoreCase(categorie);
    }

    public Produit obtenirParId(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable : id=" + id));
    }

    /**
     * US35 : recherche full-text légère par mot-clé dans le nom,
     * combinable avec un filtre catégorie.
     */
    public List<Produit> rechercher(String motCle, String categorie) {
        String mc  = (motCle   == null || motCle.isBlank())   ? null : motCle.trim();
        String cat = (categorie == null || categorie.isBlank()) ? null : categorie.trim();
        return repo.rechercherParMotCleEtCategorie(mc, cat);
    }

    // ── Écriture (US33) ───────────────────────────────────────────────────

    @Transactional
    public Produit creer(String nom, String description, String categorie, String unite) {
        validerChampsProduit(nom, categorie, unite);
        return repo.save(new Produit(nom, description, categorie, unite));
    }

    @Transactional
    public Produit modifier(Long id, String nom, String description, String categorie, String unite) {
        validerChampsProduit(nom, categorie, unite);
        Produit p = obtenirParId(id);
        p.mettreAJour(nom, description, categorie, unite);
        return repo.save(p);
    }

    @Transactional
    public void supprimer(Long id) {
        Produit p = obtenirParId(id);
        // Supprimer d'abord les stocks liés (contrainte FK stock_produit_id_fkey)
        stockRepo.deleteAll(stockRepo.findByProduitId(id));
        repo.delete(p);
    }

    // ── Validation interne ────────────────────────────────────────────────

    private static void validerChampsProduit(String nom, String categorie, String unite) {
        if (nom == null || nom.isBlank())
            throw new IllegalArgumentException("Le nom du produit est obligatoire.");
        if (categorie == null || categorie.isBlank())
            throw new IllegalArgumentException("La catégorie est obligatoire.");
        if (unite == null || unite.isBlank())
            throw new IllegalArgumentException("L'unité est obligatoire.");
    }
}
