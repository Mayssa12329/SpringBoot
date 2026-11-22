package com.medivet.vetpharma.service;

import com.medivet.vetpharma.entity.Pharmacie;
import com.medivet.vetpharma.entity.Produit;
import com.medivet.vetpharma.entity.Reservation;
import com.medivet.vetpharma.entity.Stock;
import com.medivet.vetpharma.enums.StatutReservation;
import com.medivet.vetpharma.repository.PharmacieRepository;
import com.medivet.vetpharma.repository.ProduitRepository;
import com.medivet.vetpharma.repository.ReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock ReservationRepository reservationRepo;
    @Mock ProduitRepository     produitRepo;
    @Mock PharmacieRepository   pharmacieRepo;
    @Mock StockService          stockService;

    @InjectMocks ReservationService service;

    private Produit   produit;
    private Pharmacie pharmacie;

    @BeforeEach
    void setUp() {
        produit   = new Produit("Amoxicilline", "Antibiotique", "Antibiotique", "comprimé");
        pharmacie = new Pharmacie("PharmaVet", "1 Rue X", "Tunis", "71000000");
    }

    @Test
    void creer_nouvelle_reservation() {
        String key = UUID.randomUUID().toString();
        when(reservationRepo.findByIdempotencyKey(key)).thenReturn(Optional.empty());
        when(produitRepo.findById(1L)).thenReturn(Optional.of(produit));
        when(pharmacieRepo.findById(1L)).thenReturn(Optional.of(pharmacie));
        when(stockService.reserver(any(), any(), anyInt()))
                .thenReturn(new Stock(produit, pharmacie, 40));
        when(reservationRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Reservation r = service.creer(key, 1L, 1L, 5, "user-42");

        assertThat(r.getStatut()).isEqualTo(StatutReservation.EN_ATTENTE);
        assertThat(r.getIdempotencyKey()).isEqualTo(key);
        assertThat(r.getQuantite()).isEqualTo(5);
        verify(stockService).reserver(1L, 1L, 5);
    }

    @Test
    void creer_idempotent_renvoie_reservation_existante() {
        String key = UUID.randomUUID().toString();
        Reservation existante = new Reservation(key, produit, pharmacie, 5, "user-42");
        when(reservationRepo.findByIdempotencyKey(key)).thenReturn(Optional.of(existante));

        Reservation r = service.creer(key, 1L, 1L, 5, "user-42");

        assertThat(r).isSameAs(existante);
        // Le stock ne doit PAS être modifié une deuxième fois
        verify(stockService, never()).reserver(any(), any(), anyInt());
    }

    @Test
    void annuler_restitue_le_stock() {
        Reservation r = new Reservation(UUID.randomUUID().toString(), produit, pharmacie, 5, "user-42");
        when(reservationRepo.findById(1L)).thenReturn(Optional.of(r));
        when(reservationRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Reservation annulee = service.annuler(1L);

        assertThat(annulee.getStatut()).isEqualTo(StatutReservation.ANNULEE);
        verify(stockService).liberer(any(), any(), eq(5));
    }
}
