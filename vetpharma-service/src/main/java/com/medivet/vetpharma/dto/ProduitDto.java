package com.medivet.vetpharma.dto;

import com.medivet.vetpharma.entity.Produit;

public record ProduitDto(
        Long   produitId,
        String nom,
        String description,
        String categorie,
        String unite
) {
    public static ProduitDto from(Produit p) {
        return new ProduitDto(p.getProduitId(), p.getNom(), p.getDescription(),
                              p.getCategorie(), p.getUnite());
    }
}
