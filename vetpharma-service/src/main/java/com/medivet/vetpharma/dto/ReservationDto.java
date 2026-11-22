package com.medivet.vetpharma.dto;

import com.medivet.vetpharma.entity.Reservation;

import java.time.format.DateTimeFormatter;

public record ReservationDto(
        Long   reservationId,
        String idempotencyKey,
        Long   produitId,
        Long   pharmacieId,
        int    quantite,
        String statut,
        String expirationAt
) {
    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public static ReservationDto from(Reservation r) {
        return new ReservationDto(
                r.getReservationId(),
                r.getIdempotencyKey(),
                r.getProduit().getProduitId(),
                r.getPharmacie().getPharmacieId(),
                r.getQuantite(),
                r.getStatut().name(),
                r.getExpirationAt().format(FMT));
    }
}
