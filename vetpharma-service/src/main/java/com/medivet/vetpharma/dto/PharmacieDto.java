package com.medivet.vetpharma.dto;

import com.medivet.vetpharma.entity.Pharmacie;

public record PharmacieDto(
        Long   pharmacieId,
        String nom,
        String adresse,
        String ville,
        String telephone
) {
    public static PharmacieDto from(Pharmacie p) {
        return new PharmacieDto(p.getPharmacieId(), p.getNom(), p.getAdresse(),
                                p.getVille(), p.getTelephone());
    }
}
