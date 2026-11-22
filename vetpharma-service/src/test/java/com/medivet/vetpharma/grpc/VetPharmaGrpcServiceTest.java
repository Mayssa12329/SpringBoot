package com.medivet.vetpharma.grpc;

import com.medivet.vetpharma.entity.Pharmacie;
import com.medivet.vetpharma.entity.Produit;
import com.medivet.vetpharma.entity.Reservation;
import com.medivet.vetpharma.entity.Stock;
import com.medivet.vetpharma.enums.StatutReservation;
import com.medivet.vetpharma.exception.ResourceNotFoundException;
import com.medivet.vetpharma.exception.StockIndisponibleException;
import com.medivet.vetpharma.grpc.generated.*;
import com.medivet.vetpharma.service.PharmacieService;
import com.medivet.vetpharma.service.ProduitService;
import com.medivet.vetpharma.service.ReservationService;
import com.medivet.vetpharma.service.StockService;
import io.grpc.ManagedChannel;
import io.grpc.StatusRuntimeException;
import io.grpc.inprocess.InProcessChannelBuilder;
import io.grpc.inprocess.InProcessServerBuilder;
import io.grpc.Server;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests gRPC en canal in-process (JUnit 5 + Mockito).
 *
 * Chaque groupe couvre une User Story :
 *   US33 – Catalogue produits  (CRUD)
 *   US34 – MettreAJourStock
 *   US35 – RechercherProduits
 *   US36 – ListerPharmacies / VerifierStock
 *   US37 – CreerReservation / AnnulerReservation  (idempotence RM11)
 *   US38 – ConfirmerReservation
 *   ERR  – Propagation des erreurs → Status gRPC
 */
@ExtendWith(MockitoExtension.class)
class VetPharmaGrpcServiceTest {

    // ── Infrastructure in-process ─────────────────────────────────────────

    @Mock ProduitService     produitService;
    @Mock PharmacieService   pharmacieService;
    @Mock StockService       stockService;
    @Mock ReservationService reservationService;

    private Server       server;
    private ManagedChannel channel;
    private VetPharmaServiceGrpc.VetPharmaServiceBlockingStub stub;

    // Fixtures partagées
    private Produit   produit;
    private Pharmacie pharmacie;
    private Stock     stock50;

    @BeforeEach
    void setUp() throws Exception {
        produit   = new Produit("Amoxicilline", "Antibiotique", "Antibiotique", "comprimé");
        pharmacie = new Pharmacie("PharmaVet Tunis", "12 Av. Bourguiba", "Tunis", "71000001");
        stock50   = new Stock(produit, pharmacie, 50);

        String serverName = InProcessServerBuilder.generateName();

        server = InProcessServerBuilder.forName(serverName)
                .directExecutor()
                .addService(new VetPharmaGrpcService(
                        produitService, pharmacieService, stockService, reservationService))
                .build()
                .start();

        channel = InProcessChannelBuilder.forName(serverName)
                .directExecutor()
                .build();

        stub = VetPharmaServiceGrpc.newBlockingStub(channel);
    }

    @AfterEach
    void tearDown() {
        channel.shutdownNow();
        server.shutdownNow();
    }

    // ══════════════════════════════════════════════════════════════════════
    //  US33 – Catalogue produits
    // ══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("US33 – Catalogue produits")
    class CatalogueProduits {

        @Test
        @DisplayName("ListerProduits – retourne tous les produits quand catégorie vide")
        void listerProduits_sans_filtre() {
            when(produitService.listerParCategorie("")).thenReturn(List.of(produit));

            ListerProduitsResponse resp = stub.listerProduits(
                    ListerProduitsRequest.newBuilder().setCategorie("").build());

            assertThat(resp.getProduitsList()).hasSize(1);
            assertThat(resp.getProduits(0).getNom()).isEqualTo("Amoxicilline");
            assertThat(resp.getProduits(0).getCategorie()).isEqualTo("Antibiotique");
        }

        @Test
        @DisplayName("ListerProduits – filtre par catégorie")
        void listerProduits_avec_filtre_categorie() {
            when(produitService.listerParCategorie("Vaccin")).thenReturn(List.of());

            ListerProduitsResponse resp = stub.listerProduits(
                    ListerProduitsRequest.newBuilder().setCategorie("Vaccin").build());

            assertThat(resp.getProduitsList()).isEmpty();
        }

        @Test
        @DisplayName("ObtenirProduit – retourne le bon produit")
        void obtenirProduit_existant() {
            when(produitService.obtenirParId(1L)).thenReturn(produit);

            ProduitResponse resp = stub.obtenirProduit(
                    ObtenirProduitRequest.newBuilder().setProduitId(1L).build());

            assertThat(resp.getNom()).isEqualTo("Amoxicilline");
            assertThat(resp.getUnite()).isEqualTo("comprimé");
        }

        @Test
        @DisplayName("ObtenirProduit – NOT_FOUND si produit inexistant")
        void obtenirProduit_inexistant_leve_not_found() {
            when(produitService.obtenirParId(99L))
                    .thenThrow(new ResourceNotFoundException("Produit introuvable : id=99"));

            assertThatThrownBy(() ->
                    stub.obtenirProduit(ObtenirProduitRequest.newBuilder().setProduitId(99L).build()))
                    .isInstanceOf(StatusRuntimeException.class)
                    .hasMessageContaining("NOT_FOUND");
        }

        @Test
        @DisplayName("CreerProduit – crée et retourne le nouveau produit")
        void creerProduit_ok() {
            when(produitService.creer("Vaccin Rage", "Antirabique", "Vaccin", "dose"))
                    .thenReturn(new Produit("Vaccin Rage", "Antirabique", "Vaccin", "dose"));

            ProduitResponse resp = stub.creerProduit(
                    CreerProduitRequest.newBuilder()
                            .setNom("Vaccin Rage").setDescription("Antirabique")
                            .setCategorie("Vaccin").setUnite("dose")
                            .build());

            assertThat(resp.getNom()).isEqualTo("Vaccin Rage");
            assertThat(resp.getCategorie()).isEqualTo("Vaccin");
        }

        @Test
        @DisplayName("CreerProduit – INVALID_ARGUMENT si nom vide")
        void creerProduit_nom_vide_leve_invalid_argument() {
            when(produitService.creer("", "desc", "cat", "mg"))
                    .thenThrow(new IllegalArgumentException("Le nom du produit est obligatoire."));

            assertThatThrownBy(() ->
                    stub.creerProduit(CreerProduitRequest.newBuilder()
                            .setNom("").setDescription("desc")
                            .setCategorie("cat").setUnite("mg").build()))
                    .isInstanceOf(StatusRuntimeException.class)
                    .hasMessageContaining("INVALID_ARGUMENT");
        }

        @Test
        @DisplayName("ModifierProduit – met à jour et retourne le produit modifié")
        void modifierProduit_ok() {
            Produit modifie = new Produit("Amoxicilline 1g", "Antibiotique fort", "Antibiotique", "comprimé");
            when(produitService.modifier(1L, "Amoxicilline 1g", "Antibiotique fort", "Antibiotique", "comprimé"))
                    .thenReturn(modifie);

            ProduitResponse resp = stub.modifierProduit(
                    ModifierProduitRequest.newBuilder()
                            .setProduitId(1L)
                            .setNom("Amoxicilline 1g").setDescription("Antibiotique fort")
                            .setCategorie("Antibiotique").setUnite("comprimé")
                            .build());

            assertThat(resp.getNom()).isEqualTo("Amoxicilline 1g");
        }

        @Test
        @DisplayName("ModifierProduit – NOT_FOUND si produit inexistant")
        void modifierProduit_inexistant_leve_not_found() {
            when(produitService.modifier(eq(99L), any(), any(), any(), any()))
                    .thenThrow(new ResourceNotFoundException("Produit introuvable : id=99"));

            assertThatThrownBy(() ->
                    stub.modifierProduit(ModifierProduitRequest.newBuilder()
                            .setProduitId(99L).setNom("X").setDescription("")
                            .setCategorie("C").setUnite("mg").build()))
                    .isInstanceOf(StatusRuntimeException.class)
                    .hasMessageContaining("NOT_FOUND");
        }

        @Test
        @DisplayName("SupprimerProduit – retourne succes=true")
        void supprimerProduit_ok() {
            doNothing().when(produitService).supprimer(1L);

            SupprimerProduitResponse resp = stub.supprimerProduit(
                    SupprimerProduitRequest.newBuilder().setProduitId(1L).build());

            assertThat(resp.getSucces()).isTrue();
            assertThat(resp.getMessage()).contains("1");
            verify(produitService).supprimer(1L);
        }

        @Test
        @DisplayName("SupprimerProduit – NOT_FOUND si produit inexistant")
        void supprimerProduit_inexistant_leve_not_found() {
            doThrow(new ResourceNotFoundException("Produit introuvable : id=99"))
                    .when(produitService).supprimer(99L);

            assertThatThrownBy(() ->
                    stub.supprimerProduit(SupprimerProduitRequest.newBuilder()
                            .setProduitId(99L).build()))
                    .isInstanceOf(StatusRuntimeException.class)
                    .hasMessageContaining("NOT_FOUND");
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  US34 – Mise à jour directe du stock
    // ══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("US34 – Mise à jour stock")
    class MiseAJourStock {

        @Test
        @DisplayName("MettreAJourStock – retourne le stock mis à jour")
        void mettreAJourStock_ok() {
            Stock stockMaj = new Stock(produit, pharmacie, 200);
            when(stockService.mettreAJourStock(1L, 1L, 200)).thenReturn(stockMaj);

            StockResponse resp = stub.mettreAJourStock(
                    MettreAJourStockRequest.newBuilder()
                            .setProduitId(1L).setPharmacieId(1L).setNouvelleQuantite(200)
                            .build());

            assertThat(resp.getQuantiteDispo()).isEqualTo(200);
            assertThat(resp.getStatut()).isEqualTo("DISPONIBLE");
        }

        @Test
        @DisplayName("MettreAJourStock – stock passe en RUPTURE si quantité = 0")
        void mettreAJourStock_rupture() {
            Stock stockVide = new Stock(produit, pharmacie, 0);
            when(stockService.mettreAJourStock(1L, 1L, 0)).thenReturn(stockVide);

            StockResponse resp = stub.mettreAJourStock(
                    MettreAJourStockRequest.newBuilder()
                            .setProduitId(1L).setPharmacieId(1L).setNouvelleQuantite(0)
                            .build());

            assertThat(resp.getStatut()).isEqualTo("RUPTURE");
        }

        @Test
        @DisplayName("MettreAJourStock – NOT_FOUND si stock inexistant")
        void mettreAJourStock_introuvable() {
            when(stockService.mettreAJourStock(99L, 1L, 10))
                    .thenThrow(new ResourceNotFoundException("Stock introuvable"));

            assertThatThrownBy(() ->
                    stub.mettreAJourStock(MettreAJourStockRequest.newBuilder()
                            .setProduitId(99L).setPharmacieId(1L).setNouvelleQuantite(10)
                            .build()))
                    .isInstanceOf(StatusRuntimeException.class)
                    .hasMessageContaining("NOT_FOUND");
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  US35 – Recherche produit
    // ══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("US35 – Recherche produit")
    class RechercheProduit {

        @Test
        @DisplayName("RechercherProduits – trouve par mot-clé dans le nom")
        void rechercherProduits_par_mot_cle() {
            when(produitService.rechercher("Amox", "")).thenReturn(List.of(produit));

            ListerProduitsResponse resp = stub.rechercherProduits(
                    RechercherProduitsRequest.newBuilder()
                            .setMotCle("Amox").setCategorie("")
                            .build());

            assertThat(resp.getProduitsList()).hasSize(1);
            assertThat(resp.getProduits(0).getNom()).isEqualTo("Amoxicilline");
        }

        @Test
        @DisplayName("RechercherProduits – combine mot-clé et catégorie")
        void rechercherProduits_mot_cle_et_categorie() {
            Produit vaccin = new Produit("Vaccin Rage", "Antirabique", "Vaccin", "dose");
            when(produitService.rechercher("Vaccin", "Vaccin")).thenReturn(List.of(vaccin));

            ListerProduitsResponse resp = stub.rechercherProduits(
                    RechercherProduitsRequest.newBuilder()
                            .setMotCle("Vaccin").setCategorie("Vaccin")
                            .build());

            assertThat(resp.getProduitsList()).hasSize(1);
            assertThat(resp.getProduits(0).getCategorie()).isEqualTo("Vaccin");
        }

        @Test
        @DisplayName("RechercherProduits – retourne liste vide si aucun résultat")
        void rechercherProduits_aucun_resultat() {
            when(produitService.rechercher("XYZ", "")).thenReturn(List.of());

            ListerProduitsResponse resp = stub.rechercherProduits(
                    RechercherProduitsRequest.newBuilder()
                            .setMotCle("XYZ").setCategorie("")
                            .build());

            assertThat(resp.getProduitsList()).isEmpty();
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  US36 – Pharmacies & stocks
    // ══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("US36 – Pharmacies et stocks")
    class PharmaciesEtStocks {

        @Test
        @DisplayName("ListerPharmacies – retourne toutes les pharmacies (ville vide)")
        void listerPharmacies_sans_filtre() {
            when(pharmacieService.listerParVille("")).thenReturn(List.of(pharmacie));

            ListerPharmaciesResponse resp = stub.listerPharmacies(
                    ListerPharmaciesRequest.newBuilder().setVille("").build());

            assertThat(resp.getPharmaciesList()).hasSize(1);
            assertThat(resp.getPharmacie(0).getNom()).isEqualTo("PharmaVet Tunis");
            assertThat(resp.getPharmacie(0).getVille()).isEqualTo("Tunis");
        }

        @Test
        @DisplayName("ListerPharmacies – filtre par ville")
        void listerPharmacies_par_ville() {
            Pharmacie sfax = new Pharmacie("PharmaVet Sfax", "5 Rue Lib", "Sfax", "74000002");
            when(pharmacieService.listerParVille("Sfax")).thenReturn(List.of(sfax));

            ListerPharmaciesResponse resp = stub.listerPharmacies(
                    ListerPharmaciesRequest.newBuilder().setVille("Sfax").build());

            assertThat(resp.getPharmacie(0).getVille()).isEqualTo("Sfax");
        }

        @Test
        @DisplayName("VerifierStock – retourne DISPONIBLE pour stock > 10")
        void verifierStock_disponible() {
            when(stockService.verifier(1L, 1L)).thenReturn(stock50);

            StockResponse resp = stub.verifierStock(
                    VerifierStockRequest.newBuilder()
                            .setProduitId(1L).setPharmacieId(1L).build());

            assertThat(resp.getStatut()).isEqualTo("DISPONIBLE");
            assertThat(resp.getQuantiteDispo()).isEqualTo(50);
        }

        @Test
        @DisplayName("VerifierStock – retourne FAIBLE pour stock <= 10")
        void verifierStock_faible() {
            Stock stockFaible = new Stock(produit, pharmacie, 5);
            when(stockService.verifier(1L, 1L)).thenReturn(stockFaible);

            StockResponse resp = stub.verifierStock(
                    VerifierStockRequest.newBuilder()
                            .setProduitId(1L).setPharmacieId(1L).build());

            assertThat(resp.getStatut()).isEqualTo("FAIBLE");
            assertThat(resp.getQuantiteDispo()).isEqualTo(5);
        }

        @Test
        @DisplayName("VerifierStock – retourne RUPTURE pour stock = 0")
        void verifierStock_rupture() {
            Stock stockVide = new Stock(produit, pharmacie, 0);
            when(stockService.verifier(2L, 1L)).thenReturn(stockVide);

            StockResponse resp = stub.verifierStock(
                    VerifierStockRequest.newBuilder()
                            .setProduitId(2L).setPharmacieId(1L).build());

            assertThat(resp.getStatut()).isEqualTo("RUPTURE");
        }

        @Test
        @DisplayName("VerifierStock – NOT_FOUND si couple produit/pharmacie inconnu")
        void verifierStock_introuvable() {
            when(stockService.verifier(99L, 99L))
                    .thenThrow(new ResourceNotFoundException("Stock introuvable"));

            assertThatThrownBy(() ->
                    stub.verifierStock(VerifierStockRequest.newBuilder()
                            .setProduitId(99L).setPharmacieId(99L).build()))
                    .isInstanceOf(StatusRuntimeException.class)
                    .hasMessageContaining("NOT_FOUND");
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  US37 – Réservation temporaire (RM11)
    // ══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("US37 – Réservation temporaire (RM11)")
    class ReservationTemporaire {

        @Test
        @DisplayName("CreerReservation – crée une réservation EN_ATTENTE")
        void creerReservation_ok() {
            String key = UUID.randomUUID().toString();
            Reservation r = new Reservation(key, produit, pharmacie, 3, "user-42");
            when(reservationService.creer(key, 1L, 1L, 3, "user-42")).thenReturn(r);

            ReservationResponse resp = stub.creerReservation(
                    CreerReservationRequest.newBuilder()
                            .setIdempotencyKey(key)
                            .setProduitId(1L).setPharmacieId(1L)
                            .setQuantite(3).setPatientId("user-42")
                            .build());

            assertThat(resp.getStatut()).isEqualTo("EN_ATTENTE");
            assertThat(resp.getIdempotencyKey()).isEqualTo(key);
            assertThat(resp.getQuantite()).isEqualTo(3);
        }

        @Test
        @DisplayName("CreerReservation – idempotence RM11 : même clé → même réponse")
        void creerReservation_idempotence() {
            String key = UUID.randomUUID().toString();
            Reservation existante = new Reservation(key, produit, pharmacie, 3, "user-42");

            // Deux appels avec la même clé retournent le même objet
            when(reservationService.creer(key, 1L, 1L, 3, "user-42")).thenReturn(existante);

            ReservationResponse r1 = stub.creerReservation(
                    CreerReservationRequest.newBuilder()
                            .setIdempotencyKey(key).setProduitId(1L)
                            .setPharmacieId(1L).setQuantite(3).setPatientId("user-42")
                            .build());
            ReservationResponse r2 = stub.creerReservation(
                    CreerReservationRequest.newBuilder()
                            .setIdempotencyKey(key).setProduitId(1L)
                            .setPharmacieId(1L).setQuantite(3).setPatientId("user-42")
                            .build());

            assertThat(r1.getIdempotencyKey()).isEqualTo(r2.getIdempotencyKey());
            assertThat(r1.getStatut()).isEqualTo(r2.getStatut());
            // Le service n'est appelé que 2 fois (pas de doublon côté stock)
            verify(reservationService, times(2)).creer(eq(key), any(), any(), anyInt(), any());
        }

        @Test
        @DisplayName("CreerReservation – FAILED_PRECONDITION si stock insuffisant")
        void creerReservation_stock_insuffisant() {
            String key = UUID.randomUUID().toString();
            when(reservationService.creer(key, 1L, 1L, 999, "user-42"))
                    .thenThrow(new StockIndisponibleException("Stock insuffisant : demandé=999"));

            assertThatThrownBy(() ->
                    stub.creerReservation(CreerReservationRequest.newBuilder()
                            .setIdempotencyKey(key).setProduitId(1L)
                            .setPharmacieId(1L).setQuantite(999).setPatientId("user-42")
                            .build()))
                    .isInstanceOf(StatusRuntimeException.class)
                    .hasMessageContaining("FAILED_PRECONDITION");
        }

        @Test
        @DisplayName("AnnulerReservation – passe le statut à ANNULEE")
        void annulerReservation_ok() {
            String key = UUID.randomUUID().toString();
            Reservation r = new Reservation(key, produit, pharmacie, 3, "user-42");
            r.annuler();
            when(reservationService.annuler(1L)).thenReturn(r);

            ReservationResponse resp = stub.annulerReservation(
                    AnnulerReservationRequest.newBuilder().setReservationId(1L).build());

            assertThat(resp.getStatut()).isEqualTo("ANNULEE");
        }

        @Test
        @DisplayName("AnnulerReservation – NOT_FOUND si réservation inexistante")
        void annulerReservation_inexistante() {
            when(reservationService.annuler(99L))
                    .thenThrow(new ResourceNotFoundException("Réservation introuvable : id=99"));

            assertThatThrownBy(() ->
                    stub.annulerReservation(AnnulerReservationRequest.newBuilder()
                            .setReservationId(99L).build()))
                    .isInstanceOf(StatusRuntimeException.class)
                    .hasMessageContaining("NOT_FOUND");
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  US38 – Confirmation de disponibilité
    // ══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("US38 – Confirmation de disponibilité")
    class ConfirmationDisponibilite {

        @Test
        @DisplayName("ConfirmerReservation – passe le statut à CONFIRMEE")
        void confirmerReservation_ok() {
            String key = UUID.randomUUID().toString();
            Reservation r = new Reservation(key, produit, pharmacie, 3, "user-42");
            r.confirmer();
            when(reservationService.confirmer(1L)).thenReturn(r);

            ReservationResponse resp = stub.confirmerReservation(
                    ConfirmerReservationRequest.newBuilder().setReservationId(1L).build());

            assertThat(resp.getStatut()).isEqualTo("CONFIRMEE");
            verify(reservationService).confirmer(1L);
        }

        @Test
        @DisplayName("ConfirmerReservation – idempotent : déjà CONFIRMEE → même réponse")
        void confirmerReservation_deja_confirmee() {
            String key = UUID.randomUUID().toString();
            Reservation r = new Reservation(key, produit, pharmacie, 3, "user-42");
            r.confirmer();
            // Le service retourne la réservation déjà confirmée (idempotence)
            when(reservationService.confirmer(1L)).thenReturn(r);

            ReservationResponse resp1 = stub.confirmerReservation(
                    ConfirmerReservationRequest.newBuilder().setReservationId(1L).build());
            ReservationResponse resp2 = stub.confirmerReservation(
                    ConfirmerReservationRequest.newBuilder().setReservationId(1L).build());

            assertThat(resp1.getStatut()).isEqualTo("CONFIRMEE");
            assertThat(resp2.getStatut()).isEqualTo("CONFIRMEE");
        }

        @Test
        @DisplayName("ConfirmerReservation – FAILED_PRECONDITION si réservation expirée")
        void confirmerReservation_expiree() {
            when(reservationService.confirmer(1L))
                    .thenThrow(new com.medivet.vetpharma.exception.ReservationExpireeException(
                            "La réservation 1 est expirée."));

            assertThatThrownBy(() ->
                    stub.confirmerReservation(ConfirmerReservationRequest.newBuilder()
                            .setReservationId(1L).build()))
                    .isInstanceOf(StatusRuntimeException.class)
                    .hasMessageContaining("FAILED_PRECONDITION");
        }

        @Test
        @DisplayName("ConfirmerReservation – FAILED_PRECONDITION si réservation annulée")
        void confirmerReservation_annulee() {
            when(reservationService.confirmer(1L))
                    .thenThrow(new IllegalStateException(
                            "Impossible de confirmer : la réservation 1 est annulée."));

            assertThatThrownBy(() ->
                    stub.confirmerReservation(ConfirmerReservationRequest.newBuilder()
                            .setReservationId(1L).build()))
                    .isInstanceOf(StatusRuntimeException.class)
                    .hasMessageContaining("FAILED_PRECONDITION");
        }

        @Test
        @DisplayName("ConfirmerReservation – NOT_FOUND si réservation inexistante")
        void confirmerReservation_inexistante() {
            when(reservationService.confirmer(99L))
                    .thenThrow(new ResourceNotFoundException("Réservation introuvable : id=99"));

            assertThatThrownBy(() ->
                    stub.confirmerReservation(ConfirmerReservationRequest.newBuilder()
                            .setReservationId(99L).build()))
                    .isInstanceOf(StatusRuntimeException.class)
                    .hasMessageContaining("NOT_FOUND");
        }
    }
}
