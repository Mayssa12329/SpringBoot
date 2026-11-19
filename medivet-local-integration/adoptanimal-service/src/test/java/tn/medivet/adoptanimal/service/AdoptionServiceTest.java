package tn.medivet.adoptanimal.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.medivet.adoptanimal.client.NotificationClient;
import tn.medivet.adoptanimal.entity.Adoption;
import tn.medivet.adoptanimal.entity.Annonce;
import tn.medivet.adoptanimal.entity.Candidature;
import tn.medivet.adoptanimal.entity.StatutAnnonce;
import tn.medivet.adoptanimal.entity.StatutCandidature;
import tn.medivet.adoptanimal.entity.StatutRencontre;
import tn.medivet.adoptanimal.exception.ConflitMetierException;
import tn.medivet.adoptanimal.exception.RegleMetierException;
import tn.medivet.adoptanimal.repository.AdoptionRepository;
import tn.medivet.adoptanimal.repository.AnnonceRepository;
import tn.medivet.adoptanimal.repository.CandidatureRepository;
import tn.medivet.adoptanimal.repository.RencontreRepository;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdoptionServiceTest {

    @Mock AnnonceRepository annonceRepository;
    @Mock CandidatureRepository candidatureRepository;
    @Mock RencontreRepository rencontreRepository;
    @Mock AdoptionRepository adoptionRepository;
    @Mock HistoriqueService historiqueService;
    @Mock NotificationClient notificationClient;
    @InjectMocks AdoptionService service;

    private Annonce annonce(StatutAnnonce statut) {
        Annonce a = new Annonce();
        a.setId(1L);
        a.setStatut(statut);
        return a;
    }

    private Candidature candidature(Long id, Long candidatId, StatutCandidature statut) {
        Candidature c = new Candidature();
        c.setId(id);
        c.setAnnonceId(1L);
        c.setCandidatId(candidatId);
        c.setStatut(statut);
        return c;
    }

    @Test
    void finaliser_annonceDejaCloturee_conflit() {
        when(annonceRepository.findById(1L)).thenReturn(Optional.of(annonce(StatutAnnonce.CLOTUREE)));

        assertThrows(ConflitMetierException.class, () -> service.finaliser(1L, 5L, 1L));
    }

    @Test
    void finaliser_sansRencontreEffectuee_refuseAvecMotif() {
        when(annonceRepository.findById(1L)).thenReturn(Optional.of(annonce(StatutAnnonce.ACTIVE)));
        when(adoptionRepository.existsByAnnonceId(1L)).thenReturn(false);
        when(candidatureRepository.findById(5L))
                .thenReturn(Optional.of(candidature(5L, 100L, StatutCandidature.ACCEPTEE)));
        when(rencontreRepository.existsByCandidatureIdAndStatut(5L, StatutRencontre.EFFECTUEE)).thenReturn(false);

        RegleMetierException ex = assertThrows(RegleMetierException.class, () -> service.finaliser(1L, 5L, 1L));

        assertEquals(1, ex.getMotifs().size());
    }

    @Test
    void finaliser_ok_clotureAnnonceEtRefuseLesAutresCandidatures() {
        Annonce annonce = annonce(StatutAnnonce.ACTIVE);
        Candidature autre = candidature(6L, 101L, StatutCandidature.SOUMISE);
        when(annonceRepository.findById(1L)).thenReturn(Optional.of(annonce));
        when(adoptionRepository.existsByAnnonceId(1L)).thenReturn(false);
        when(candidatureRepository.findById(5L))
                .thenReturn(Optional.of(candidature(5L, 100L, StatutCandidature.ACCEPTEE)));
        when(rencontreRepository.existsByCandidatureIdAndStatut(5L, StatutRencontre.EFFECTUEE)).thenReturn(true);
        when(adoptionRepository.saveAndFlush(any(Adoption.class))).thenAnswer(i -> {
            Adoption a = i.getArgument(0);
            a.setId(9L);
            return a;
        });
        when(candidatureRepository.findByAnnonceIdAndIdNot(1L, 5L)).thenReturn(List.of(autre));

        Adoption adoption = service.finaliser(1L, 5L, 1L);

        assertEquals(9L, adoption.getId());
        assertEquals(StatutAnnonce.CLOTUREE, annonce.getStatut());
        assertEquals(StatutCandidature.REFUSEE, autre.getStatut());
    }
}
