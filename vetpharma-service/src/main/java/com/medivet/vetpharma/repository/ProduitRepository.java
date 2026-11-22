package com.medivet.vetpharma.repository;

import com.medivet.vetpharma.entity.Produit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProduitRepository extends JpaRepository<Produit, Long> {

    /** US33 : filtre par catégorie exacte (insensible à la casse). */
    List<Produit> findByCategorieIgnoreCase(String categorie);

    /**
     * US35 : recherche par mot-clé dans le nom (contains, insensible à la casse).
     * Utilise une native query pour éviter l'ambiguïté de type null avec LOWER() en JPQL.
     */
    @Query(value = "SELECT * FROM produit p " +
                   "WHERE (:motCle IS NULL OR LOWER(p.nom) LIKE LOWER(CONCAT('%', CAST(:motCle AS text), '%'))) " +
                   "AND   (:categorie IS NULL OR LOWER(p.categorie) = LOWER(CAST(:categorie AS text)))",
           nativeQuery = true)
    List<Produit> rechercherParMotCleEtCategorie(@Param("motCle")    String motCle,
                                                 @Param("categorie") String categorie);
}
