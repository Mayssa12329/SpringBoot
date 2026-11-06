package tn.medivet.adoptanimal.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.medivet.adoptanimal.client.NotificationClient;
import tn.medivet.adoptanimal.dto.CandidatureRequest;
import tn.medivet.adoptanimal.entity.Annonce;
import tn.medivet.adoptanimal.entity.Candidature;
import tn.medivet.adoptanimal.entity.StatutAnnonce;
import tn.medivet.adoptanimal.entity.StatutCandidature;
import tn.medivet.adoptanimal.exception.ConflitMetierException;
import tn.medivet.adoptanimal.repository.AnnonceRepository;
import tn.medivet.adoptanimal.repository.CandidatureRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CandidatureServiceTest {

    @Mock AnnonceRepository annonceRepository;
    @Mock CandidatureRepository candidatureRepository;
    @Mock HistoriqueService historiqueService;
    @Mock NotificationClient notificationClient;
    @InjectMocks CandidatureService service;

    private Annonce annonce(StatutAnnonce statut) {
        Annonce a = new Annonce();
        a.setId(1L);
        a.setStatut(statut);
        return a;
    }

    @Test
    void soumettre_candidatureActiveExistante_conflit() {
        when(annonceRepository.findById(1L)).thenReturn(Optional.of(annonce(StatutAnnonce.ACTIVE)));
        when(candidatureRepository.existsByAnnonceIdAndCandidatIdAndStatutIn(anyLong(), anyLong(), anyCollection()))
                .thenReturn(true);

        assertThrows(ConflitMetierException.class,
                () -> service.soumettre(1L, new CandidatureRequest(100L, null)));
        verify(candidatureRepository, never()).saveAndFlush(any());
    }

    @Test
    void soumettre_animalDejaAdopte_conflit() {
        when(annonceRepository.findById(1L)).thenReturn(Optional.of(annonce(StatutAnnonce.CLOTUREE)));

        assertThrows(ConflitMetierException.class,
                () -> service.soumettre(1L, new CandidatureRequest(100L, null)));
    }

    @Test
    void changerStatut_transitionInvalide_conflitEtEtatInchange() {
        Candidature c = new Candidature();
        c.setId(5L);
        c.setStatut(StatutCandidature.SOUMISE);
        when(candidatureRepository.findById(5L)).thenReturn(Optional.of(c));

        assertThrows(ConflitMetierException.class,
                () -> service.changerStatut(5L, StatutCandidature.ACCEPTEE, null, 1L));

        org.junit.jupiter.api.Assertions.assertEquals(StatutCandidature.SOUMISE, c.getStatut());
        verify(candidatureRepository, never()).save(any());
    }
}
