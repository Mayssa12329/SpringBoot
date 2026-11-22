package com.medivet.vetpharma.service;

import com.medivet.vetpharma.entity.Pharmacie;
import com.medivet.vetpharma.entity.Produit;
import com.medivet.vetpharma.entity.Stock;
import com.medivet.vetpharma.enums.StatutStock;
import com.medivet.vetpharma.exception.StockIndisponibleException;
import com.medivet.vetpharma.repository.StockRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StockServiceTest {

    @Mock  StockRepository repo;
    @InjectMocks StockService service;

    private Produit   produit;
    private Pharmacie pharmacie;
    private Stock     stock;

    @BeforeEach
    void setUp() {
        produit   = new Produit("Amoxicilline", "Antibiotique", "Antibiotique", "comprimé");
        pharmacie = new Pharmacie("PharmaVet", "1 Rue X", "Tunis", "71000000");
        stock     = new Stock(produit, pharmacie, 50);
    }

    @Test
    void reserver_diminue_le_stock() {
        when(repo.findByProduitAndPharmacieForUpdate(any(), any())).thenReturn(Optional.of(stock));
        when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Stock result = service.reserver(1L, 1L, 10);

        assertThat(result.getQuantiteDispo()).isEqualTo(40);
        assertThat(result.getStatut()).isEqualTo(StatutStock.DISPONIBLE);
    }

    @Test
    void reserver_passe_en_faible_quand_quantite_basse() {
        when(repo.findByProduitAndPharmacieForUpdate(any(), any())).thenReturn(Optional.of(stock));
        when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Stock result = service.reserver(1L, 1L, 42);  // 50 - 42 = 8

        assertThat(result.getQuantiteDispo()).isEqualTo(8);
        assertThat(result.getStatut()).isEqualTo(StatutStock.FAIBLE);
    }

    @Test
    void reserver_leve_exception_si_stock_insuffisant() {
        when(repo.findByProduitAndPharmacieForUpdate(any(), any())).thenReturn(Optional.of(stock));

        assertThatThrownBy(() -> service.reserver(1L, 1L, 100))
                .isInstanceOf(StockIndisponibleException.class)
                .hasMessageContaining("insuffisant");
    }

    @Test
    void liberer_restitue_les_unites() {
        Stock stockFaible = new Stock(produit, pharmacie, 5);
        when(repo.findByProduitAndPharmacieForUpdate(any(), any())).thenReturn(Optional.of(stockFaible));
        when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.liberer(1L, 1L, 10);

        assertThat(stockFaible.getQuantiteDispo()).isEqualTo(15);
        assertThat(stockFaible.getStatut()).isEqualTo(StatutStock.DISPONIBLE);
    }
}
