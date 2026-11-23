package com.medivet.vetinterop.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.medivet.vetinterop.entity.PuceRegistre;
import com.medivet.vetinterop.repository.PuceRegistreRepository;
import com.medivet.vetinterop.soap.generated.Verdict;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegistreServiceTest {

    @Mock
    PuceRegistreRepository repository;

    @InjectMocks
    RegistreService service;

    @Test
    void puceInconnueEstUnResultatMetierNotFoundEtPasUneErreur() {
        when(repository.findById("999000000000001")).thenReturn(Optional.empty());

        var resultat = service.verifier("999000000000001");

        assertThat(resultat.verdict()).isEqualTo(Verdict.NOT_FOUND);
    }

    @Test
    void puceVerifieeDonneVerified() {
        when(repository.findById("250268500123456"))
                .thenReturn(Optional.of(new PuceRegistre("250268500123456", "Rex", "CHIEN", "VERIFIE", "ok")));

        assertThat(service.verifier("250268500123456").verdict()).isEqualTo(Verdict.VERIFIED);
    }

    @Test
    void puceIncoherenteDonneInconsistent() {
        when(repository.findById("250268500999001"))
                .thenReturn(Optional.of(new PuceRegistre("250268500999001", "Kiko", "CHIEN", "INCOHERENT", "espèce")));

        assertThat(service.verifier("250268500999001").verdict()).isEqualTo(Verdict.INCONSISTENT);
    }

    @Test
    void puceEnCoursDeVerificationDonneUndetermined() {
        when(repository.findById("250268500999002"))
                .thenReturn(Optional.of(new PuceRegistre("250268500999002", "Luna", "CHAT", "INDETERMINE", "en cours")));

        assertThat(service.verifier("250268500999002").verdict()).isEqualTo(Verdict.UNDETERMINED);
    }
}
