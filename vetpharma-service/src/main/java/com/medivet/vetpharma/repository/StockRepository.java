package com.medivet.vetpharma.repository;

import com.medivet.vetpharma.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, Long> {

    /** Recherche avec verrou pessimiste pour les réservations atomiques. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Stock s WHERE s.produit.produitId = :produitId AND s.pharmacie.pharmacieId = :pharmacieId")
    Optional<Stock> findByProduitAndPharmacieForUpdate(@Param("produitId")   Long produitId,
                                                       @Param("pharmacieId") Long pharmacieId);

    @Query("SELECT s FROM Stock s WHERE s.pharmacie.pharmacieId = :pharmacieId")
    List<Stock> findByPharmacieId(@Param("pharmacieId") Long pharmacieId);

    List<Stock> findAll();
}
