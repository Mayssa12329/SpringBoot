package com.medivet.adoptanimal.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.medivet.adoptanimal.client.EligibiliteClient;
import com.medivet.adoptanimal.client.EligibiliteResponse;
import com.medivet.adoptanimal.client.IdentiteClient;
import com.medivet.adoptanimal.client.IdentiteVerdict;
import com.medivet.adoptanimal.dto.AnnonceRequest;
import com.medivet.adoptanimal.model.Annonce;
import com.medivet.adoptanimal.model.StatutAnnonce;
import com.medivet.adoptanimal.exception.RegleMetierException;
import com.medivet.adoptanimal.repository.AnnonceRepository;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnnonceServiceTest {

    @Mock AnnonceRepository annonceRepository;
    @Mock IdentiteClient identiteClient;
    @Mock EligibiliteClient eligibiliteClient;
    @Mock HistoriqueService historiqueService;
    @InjectMocks AnnonceService service;

    private final AnnonceRequest requete =
            new AnnonceRequest(1L, "250268500123456", "Rex", "CHIEN", 3, "Tunis", "Gentil", null, 10L);

    @BeforeEach
    void setUp() {
        lenient().when(annonceRepository.save(any(Annonce.class))).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void publier_identiteVerifieeEtEligible_annonceActive() {
        when(identiteClient.verifier("250268500123456")).thenReturn(IdentiteVerdict.VERIFIED);
        when(eligibiliteClient.verifier(1L)).thenReturn(new EligibiliteResponse("ELIGIBLE", List.of()));

        Annonce annonce = service.publier(requete, 10L);

        assertEquals(StatutAnnonce.ACTIVE, annonce.getStatut());
    }

    @Test
    void publier_puceInconnue_refuseAvecMotifs() {
        when(identiteClient.verifier("250268500123456")).thenReturn(IdentiteVerdict.NOT_FOUND);
        when(eligibiliteClient.verifier(1L)).thenReturn(new EligibiliteResponse("ELIGIBLE", List.of()));

        RegleMetierException ex = assertThrows(RegleMetierException.class, () -> service.publier(requete, 10L));

        assertEquals(1, ex.getMotifs().size());
        verify(annonceRepository, never()).save(any());
    }

    @Test
    void publier_animalNonEligible_refuseAvecLesMotifsDePetPass() {
        when(identiteClient.verifier("250268500123456")).thenReturn(IdentiteVerdict.VERIFIED);
        when(eligibiliteClient.verifier(1L))
                .thenReturn(new EligibiliteResponse("NOT_ELIGIBLE", List.of("Vaccin manquant")));

        RegleMetierException ex = assertThrows(RegleMetierException.class, () -> service.publier(requete, 10L));

        assertTrue(ex.getMotifs().contains("Vaccin manquant"));
    }

    @Test
    void publier_registrePanne_annonceEnAttenteDeVerification() {
        when(identiteClient.verifier("250268500123456")).thenReturn(IdentiteVerdict.INDISPONIBLE);
        when(eligibiliteClient.verifier(1L)).thenReturn(new EligibiliteResponse("ELIGIBLE", List.of()));

        Annonce annonce = service.publier(requete, 10L);

        assertEquals(StatutAnnonce.VERIFICATION_EN_ATTENTE, annonce.getStatut());
    }
}
