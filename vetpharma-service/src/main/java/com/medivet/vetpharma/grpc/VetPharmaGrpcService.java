package com.medivet.vetpharma.grpc;

import com.medivet.vetpharma.entity.Produit;
import com.medivet.vetpharma.entity.Reservation;
import com.medivet.vetpharma.entity.Stock;
import com.medivet.vetpharma.exception.GlobalExceptionHandler;
import com.medivet.vetpharma.grpc.generated.*;
import com.medivet.vetpharma.service.PharmacieService;
import com.medivet.vetpharma.service.ProduitService;
import com.medivet.vetpharma.service.ReservationService;
import com.medivet.vetpharma.service.StockService;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Implémentation de tous les RPCs <b>unaires</b> de VetPharmaService.
 *
 * <ul>
 *   <li>US33 – Catalogue produits : ListerProduits, ObtenirProduit,
 *              CreerProduit, ModifierProduit, SupprimerProduit</li>
 *   <li>US34 – MettreAJourStock</li>
 *   <li>US35 – RechercherProduits (nom + catégorie)</li>
 *   <li>US36 – ListerPharmacies, VerifierStock</li>
 *   <li>US37 – CreerReservation (idempotence RM11), AnnulerReservation</li>
 *   <li>US38 – ConfirmerReservation</li>
 * </ul>
 *
 * Le RPC streaming {@code SuivreStocks} est dans {@link VetPharmaStreamService}.
 */
@GrpcService
public class VetPharmaGrpcService extends VetPharmaServiceGrpc.VetPharmaServiceImplBase {

    private static final Logger log = LoggerFactory.getLogger(VetPharmaGrpcService.class);

    private final ProduitService     produitService;
    private final PharmacieService   pharmacieService;
    private final StockService       stockService;
    private final ReservationService reservationService;

    public VetPharmaGrpcService(ProduitService     produitService,
                                PharmacieService   pharmacieService,
                                StockService       stockService,
                                ReservationService reservationService) {
        this.produitService     = produitService;
        this.pharmacieService   = pharmacieService;
        this.stockService       = stockService;
        this.reservationService = reservationService;
    }

    // ══════════════════════════════════════════════════════════════════════
    //  US33 – Catalogue produits
    // ══════════════════════════════════════════════════════════════════════

    @Override
    public void listerProduits(ListerProduitsRequest req,
                               StreamObserver<ListerProduitsResponse> obs) {
        try {
            ListerProduitsResponse.Builder b = ListerProduitsResponse.newBuilder();
            produitService.listerParCategorie(req.getCategorie())
                    .stream().map(this::toProduitResponse).forEach(b::addProduits);
            obs.onNext(b.build());
            obs.onCompleted();
        } catch (Exception e) {
            handleError("listerProduits", e, obs);
        }
    }

    @Override
    public void obtenirProduit(ObtenirProduitRequest req,
                               StreamObserver<ProduitResponse> obs) {
        try {
            obs.onNext(toProduitResponse(produitService.obtenirParId(req.getProduitId())));
            obs.onCompleted();
        } catch (Exception e) {
            handleError("obtenirProduit", e, obs);
        }
    }

    /** US33 – Créer un nouveau produit dans le catalogue. */
    @Override
    public void creerProduit(CreerProduitRequest req,
                             StreamObserver<ProduitResponse> obs) {
        try {
            Produit p = produitService.creer(
                    req.getNom(), req.getDescription(),
                    req.getCategorie(), req.getUnite());
            obs.onNext(toProduitResponse(p));
            obs.onCompleted();
        } catch (Exception e) {
            handleError("creerProduit", e, obs);
        }
    }

    /** US33 – Modifier un produit existant. */
    @Override
    public void modifierProduit(ModifierProduitRequest req,
                                StreamObserver<ProduitResponse> obs) {
        try {
            Produit p = produitService.modifier(
                    req.getProduitId(), req.getNom(), req.getDescription(),
                    req.getCategorie(), req.getUnite());
            obs.onNext(toProduitResponse(p));
            obs.onCompleted();
        } catch (Exception e) {
            handleError("modifierProduit", e, obs);
        }
    }

    /** US33 – Supprimer un produit du catalogue. */
    @Override
    public void supprimerProduit(SupprimerProduitRequest req,
                                 StreamObserver<SupprimerProduitResponse> obs) {
        try {
            produitService.supprimer(req.getProduitId());
            obs.onNext(SupprimerProduitResponse.newBuilder()
                    .setSucces(true)
                    .setMessage("Produit " + req.getProduitId() + " supprimé.")
                    .build());
            obs.onCompleted();
        } catch (Exception e) {
            handleError("supprimerProduit", e, obs);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  US34 – Mise à jour directe du stock
    // ══════════════════════════════════════════════════════════════════════

    /** US34 – La pharmacie déclare une nouvelle quantité absolue pour un produit. */
    @Override
    public void mettreAJourStock(MettreAJourStockRequest req,
                                 StreamObserver<StockResponse> obs) {
        try {
            Stock s = stockService.mettreAJourStock(
                    req.getProduitId(), req.getPharmacieId(), req.getNouvelleQuantite());
            obs.onNext(toStockResponse(s));
            obs.onCompleted();
        } catch (Exception e) {
            handleError("mettreAJourStock", e, obs);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  US35 – Recherche produit
    // ══════════════════════════════════════════════════════════════════════

    /** US35 – Recherche par mot-clé dans le nom, filtre catégorie optionnel. */
    @Override
    public void rechercherProduits(RechercherProduitsRequest req,
                                   StreamObserver<ListerProduitsResponse> obs) {
        try {
            ListerProduitsResponse.Builder b = ListerProduitsResponse.newBuilder();
            produitService.rechercher(req.getMotCle(), req.getCategorie())
                    .stream().map(this::toProduitResponse).forEach(b::addProduits);
            obs.onNext(b.build());
            obs.onCompleted();
        } catch (Exception e) {
            handleError("rechercherProduits", e, obs);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  US36 – Pharmacies & stocks
    // ══════════════════════════════════════════════════════════════════════

    @Override
    public void listerPharmacies(ListerPharmaciesRequest req,
                                 StreamObserver<ListerPharmaciesResponse> obs) {
        try {
            ListerPharmaciesResponse.Builder b = ListerPharmaciesResponse.newBuilder();
            pharmacieService.listerParVille(req.getVille())
                    .stream()
                    .map(ph -> PharmacieResponse.newBuilder()
                            .setPharmacieId(ph.getPharmacieId())
                            .setNom(ph.getNom())
                            .setAdresse(ph.getAdresse())
                            .setVille(ph.getVille())
                            .setTelephone(ph.getTelephone() != null ? ph.getTelephone() : "")
                            .build())
                    .forEach(b::addPharmacies);
            obs.onNext(b.build());
            obs.onCompleted();
        } catch (Exception e) {
            handleError("listerPharmacies", e, obs);
        }
    }

    @Override
    public void verifierStock(VerifierStockRequest req,
                              StreamObserver<StockResponse> obs) {
        try {
            obs.onNext(toStockResponse(
                    stockService.verifier(req.getProduitId(), req.getPharmacieId())));
            obs.onCompleted();
        } catch (Exception e) {
            handleError("verifierStock", e, obs);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  US37 – Réservation temporaire
    // ══════════════════════════════════════════════════════════════════════

    @Override
    public void creerReservation(CreerReservationRequest req,
                                 StreamObserver<ReservationResponse> obs) {
        try {
            Reservation r = reservationService.creer(
                    req.getIdempotencyKey(), req.getProduitId(),
                    req.getPharmacieId(), req.getQuantite(), req.getPatientId());
            obs.onNext(toReservationResponse(r));
            obs.onCompleted();
        } catch (Exception e) {
            handleError("creerReservation", e, obs);
        }
    }

    @Override
    public void annulerReservation(AnnulerReservationRequest req,
                                   StreamObserver<ReservationResponse> obs) {
        try {
            obs.onNext(toReservationResponse(
                    reservationService.annuler(req.getReservationId())));
            obs.onCompleted();
        } catch (Exception e) {
            handleError("annulerReservation", e, obs);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  US38 – Confirmation de disponibilité
    // ══════════════════════════════════════════════════════════════════════

    /** US38 – La pharmacie confirme qu'elle peut honorer la réservation. */
    @Override
    public void confirmerReservation(ConfirmerReservationRequest req,
                                     StreamObserver<ReservationResponse> obs) {
        try {
            obs.onNext(toReservationResponse(
                    reservationService.confirmer(req.getReservationId())));
            obs.onCompleted();
        } catch (Exception e) {
            handleError("confirmerReservation", e, obs);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  Helpers
    // ══════════════════════════════════════════════════════════════════════

    private ProduitResponse toProduitResponse(Produit p) {
        return ProduitResponse.newBuilder()
                .setProduitId(p.getProduitId())
                .setNom(p.getNom())
                .setDescription(p.getDescription() != null ? p.getDescription() : "")
                .setCategorie(p.getCategorie())
                .setUnite(p.getUnite())
                .build();
    }

    private static StockResponse toStockResponse(Stock s) {
        return StockResponse.newBuilder()
                .setStockId(s.getStockId())
                .setProduitId(s.getProduit().getProduitId())
                .setPharmacieId(s.getPharmacie().getPharmacieId())
                .setQuantiteDispo(s.getQuantiteDispo())
                .setStatut(s.getStatut().name())
                .build();
    }

    private static ReservationResponse toReservationResponse(Reservation r) {
        return ReservationResponse.newBuilder()
                .setReservationId(r.getReservationId())
                .setIdempotencyKey(r.getIdempotencyKey())
                .setProduitId(r.getProduit().getProduitId())
                .setPharmacieId(r.getPharmacie().getPharmacieId())
                .setQuantite(r.getQuantite())
                .setStatut(r.getStatut().name())
                .setExpirationAt(r.getExpirationAt().toString())
                .build();
    }

    private <T> void handleError(String rpc, Exception e, StreamObserver<T> obs) {
        log.error("{} error : {}", rpc, e.getMessage(), e);
        obs.onError(GlobalExceptionHandler.toGrpcStatus(e).asRuntimeException());
    }
}
