package com.medivet.vetinterop.endpoint;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import com.medivet.vetinterop.service.RegistreService;
import com.medivet.vetinterop.soap.generated.Verdict;
import com.medivet.vetinterop.soap.generated.VerifyAnimalIdentityRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

class AnimalIdentityEndpointTest {

    private final RegistreService registreService = Mockito.mock(RegistreService.class);
    private final AnimalIdentityEndpoint endpoint = new AnimalIdentityEndpoint(registreService);

    @Test
    void transformeLeResultatDuRegistreEnReponseSoap() {
        when(registreService.verifier("250268500123456"))
                .thenReturn(new RegistreService.Resultat(Verdict.VERIFIED, "Identité confirmée"));
        VerifyAnimalIdentityRequest requete = new VerifyAnimalIdentityRequest();
        requete.setPuce("250268500123456");

        var reponse = endpoint.verifyAnimalIdentity(requete);

        assertThat(reponse.getVerdict()).isEqualTo(Verdict.VERIFIED);
        assertThat(reponse.getMessage()).isEqualTo("Identité confirmée");
    }

    @Test
    void puceInconnueRenvoieNotFoundSansException() {
        when(registreService.verifier("999000000000001"))
                .thenReturn(new RegistreService.Resultat(Verdict.NOT_FOUND, "Puce inconnue du registre"));
        VerifyAnimalIdentityRequest requete = new VerifyAnimalIdentityRequest();
        requete.setPuce("999000000000001");

        assertThat(endpoint.verifyAnimalIdentity(requete).getVerdict()).isEqualTo(Verdict.NOT_FOUND);
    }
}
