package com.medivet.vetpharma.dto;

import com.medivet.vetpharma.entity.Stock;

public record StockDto(
        Long   stockId,
        Long   produitId,
        Long   pharmacieId,
        int    quantiteDispo,
        String statut
) {
    public static StockDto from(Stock s) {
        return new StockDto(s.getStockId(),
                            s.getProduit().getProduitId(),
                            s.getPharmacie().getPharmacieId(),
                            s.getQuantiteDispo(),
                            s.getStatut().name());
    }
}
