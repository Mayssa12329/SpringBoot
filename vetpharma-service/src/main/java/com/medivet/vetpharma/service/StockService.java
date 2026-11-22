package com.medivet.vetpharma.service;

import com.medivet.vetpharma.entity.Stock;
import com.medivet.vetpharma.exception.ResourceNotFoundException;
import com.medivet.vetpharma.exception.StockIndisponibleException;
import com.medivet.vetpharma.repository.StockRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StockService {

    private final StockRepository repo;

    public StockService(StockRepository repo) {
        this.repo = repo;
    }

    // ── Lecture ───────────────────────────────────────────────────────────

    /**
     * VerifierStock : lecture simple sans verrou (readOnly = true).
     * Le verrou pessimiste n'est nécessaire que pour les opérations d'écriture.
     */
    @Transactional(readOnly = true)
    public Stock verifier(Long produitId, Long pharmacieId) {
        return repo.findByProduitAndPharmacie(produitId, pharmacieId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Stock introuvable pour produit=" + produitId
                        + " pharmacie=" + pharmacieId));
    }

    @Transactional(readOnly = true)
    public List<Stock> listerParPharmacie(Long pharmacieId) {
        return repo.findByPharmacieId(pharmacieId);
    }

    @Transactional(readOnly = true)
    public List<Stock> listerTous() {
        return repo.findAll();
    }

    // ── Écriture ─────────────────────────────────────────────────────────

    /**
     * US34 : mise à jour directe de la quantité par la pharmacie (réapprovisionnement,
     * correction d'inventaire). La valeur est absolue, pas un delta.
     */
    @Transactional
    public Stock mettreAJourStock(Long produitId, Long pharmacieId, int nouvelleQuantite) {
        Stock stock = repo.findByProduitAndPharmacieForUpdate(produitId, pharmacieId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Stock introuvable pour produit=" + produitId
                        + " pharmacie=" + pharmacieId));
        stock.mettreAJourQuantite(nouvelleQuantite);
        return repo.save(stock);
    }

    /**
     * Décrémente le stock de façon atomique (appelé par {@link ReservationService}).
     */
    @Transactional
    public Stock reserver(Long produitId, Long pharmacieId, int quantite) {
        Stock stock = repo.findByProduitAndPharmacieForUpdate(produitId, pharmacieId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Stock introuvable pour produit=" + produitId
                        + " pharmacie=" + pharmacieId));

        if (stock.getQuantiteDispo() < quantite) {
            throw new StockIndisponibleException(
                    "Stock insuffisant : demandé=" + quantite
                    + ", disponible=" + stock.getQuantiteDispo());
        }

        stock.reserver(quantite);
        return repo.save(stock);
    }

    /**
     * Restitue les unités au stock (annulation / expiration réservation).
     */
    @Transactional
    public void liberer(Long produitId, Long pharmacieId, int quantite) {
        repo.findByProduitAndPharmacieForUpdate(produitId, pharmacieId)
            .ifPresent(s -> {
                s.liberer(quantite);
                repo.save(s);
            });
    }
}
