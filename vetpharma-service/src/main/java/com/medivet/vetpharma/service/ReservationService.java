package com.medivet.vetpharma.service;

import com.medivet.vetpharma.entity.Pharmacie;
import com.medivet.vetpharma.entity.Produit;
import com.medivet.vetpharma.entity.Reservation;
import com.medivet.vetpharma.enums.StatutReservation;
import com.medivet.vetpharma.exception.ReservationExpireeException;
import com.medivet.vetpharma.exception.ResourceNotFoundException;
import com.medivet.vetpharma.repository.PharmacieRepository;
import com.medivet.vetpharma.repository.ProduitRepository;
import com.medivet.vetpharma.repository.ReservationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Gère le cycle de vie complet des réservations (US37 + US38) :
 * <ul>
 *   <li>US37 – Idempotence RM11 : même {@code idempotencyKey} → même réservation.</li>
 *   <li>US37 – TTL 15 min : scheduler expire automatiquement et restitue le stock.</li>
 *   <li>US38 – Confirmation explicite par la pharmacie.</li>
 * </ul>
 */
@Service
public class ReservationService {

    private static final Logger log = LoggerFactory.getLogger(ReservationService.class);

    private final ReservationRepository reservationRepo;
    private final ProduitRepository     produitRepo;
    private final PharmacieRepository   pharmacieRepo;
    private final StockService          stockService;

    public ReservationService(ReservationRepository reservationRepo,
                              ProduitRepository     produitRepo,
                              PharmacieRepository   pharmacieRepo,
                              StockService          stockService) {
        this.reservationRepo = reservationRepo;
        this.produitRepo     = produitRepo;
        this.pharmacieRepo   = pharmacieRepo;
        this.stockService    = stockService;
    }

    // ── US37 : Créer (idempotent) ─────────────────────────────────────────

    @Transactional
    public Reservation creer(String idempotencyKey,
                             Long   produitId,
                             Long   pharmacieId,
                             int    quantite,
                             String patientId) {

        // RM11 : clé déjà connue → renvoie la réservation existante sans retoucher le stock
        Optional<Reservation> existante = reservationRepo.findByIdempotencyKey(idempotencyKey);
        if (existante.isPresent()) {
            log.info("Réservation idempotente retrouvée : key={}", idempotencyKey);
            return existante.get();
        }

        Produit produit = produitRepo.findById(produitId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Produit introuvable : id=" + produitId));
        Pharmacie pharmacie = pharmacieRepo.findById(pharmacieId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Pharmacie introuvable : id=" + pharmacieId));

        // Décrémente le stock de façon atomique (lève StockIndisponibleException si insuffisant)
        stockService.reserver(produitId, pharmacieId, quantite);

        Reservation reservation = new Reservation(idempotencyKey, produit, pharmacie, quantite, patientId);
        return reservationRepo.save(reservation);
    }

    // ── US37 : Annuler ────────────────────────────────────────────────────

    @Transactional
    public Reservation annuler(Long reservationId) {
        Reservation r = findOrThrow(reservationId);

        if (r.getStatut() == StatutReservation.EXPIREE) {
            throw new ReservationExpireeException(
                    "La réservation " + reservationId + " est déjà expirée.");
        }
        if (r.getStatut() == StatutReservation.ANNULEE) {
            return r; // idempotent : déjà annulée
        }

        // Restitue le stock uniquement si la réservation était encore EN_ATTENTE
        if (r.getStatut() == StatutReservation.EN_ATTENTE) {
            stockService.liberer(r.getProduit().getProduitId(),
                                 r.getPharmacie().getPharmacieId(),
                                 r.getQuantite());
        }

        r.annuler();
        return reservationRepo.save(r);
    }

    // ── US38 : Confirmer la disponibilité ─────────────────────────────────

    /**
     * La pharmacie confirme qu'elle peut honorer la réservation.
     * Seules les réservations EN_ATTENTE non expirées peuvent être confirmées.
     */
    @Transactional
    public Reservation confirmer(Long reservationId) {
        Reservation r = findOrThrow(reservationId);

        if (r.estExpiree() || r.getStatut() == StatutReservation.EXPIREE) {
            throw new ReservationExpireeException(
                    "Impossible de confirmer : la réservation " + reservationId + " est expirée.");
        }
        if (r.getStatut() == StatutReservation.ANNULEE) {
            throw new IllegalStateException(
                    "Impossible de confirmer : la réservation " + reservationId + " est annulée.");
        }
        if (r.getStatut() == StatutReservation.CONFIRMEE) {
            return r; // idempotent : déjà confirmée
        }

        r.confirmer();
        log.info("Réservation {} confirmée par la pharmacie {}",
                 reservationId, r.getPharmacie().getPharmacieId());
        return reservationRepo.save(r);
    }

    // ── Purge planifiée (US37 – TTL) ─────────────────────────────────────

    /**
     * Expire toutes les réservations EN_ATTENTE dont le TTL est dépassé
     * et restitue les quantités au stock. Tourne toutes les 60 secondes.
     */
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void purgerReservationsExpirees() {
        List<Reservation> expirees = reservationRepo.findExpirees(LocalDateTime.now());
        if (expirees.isEmpty()) return;

        log.info("Purge TTL : {} réservation(s) expirée(s)", expirees.size());
        for (Reservation r : expirees) {
            stockService.liberer(r.getProduit().getProduitId(),
                                 r.getPharmacie().getPharmacieId(),
                                 r.getQuantite());
            r.expirer();
            reservationRepo.save(r);
        }
    }

    // ── Helper ────────────────────────────────────────────────────────────

    private Reservation findOrThrow(Long id) {
        return reservationRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Réservation introuvable : id=" + id));
    }
}
