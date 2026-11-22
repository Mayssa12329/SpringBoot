package com.medivet.vetinterop.endpoint;

import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;
import com.medivet.vetinterop.service.RegistreService;
import com.medivet.vetinterop.soap.generated.VerifyAnimalIdentityRequest;
import com.medivet.vetinterop.soap.generated.VerifyAnimalIdentityResponse;

@Endpoint
public class AnimalIdentityEndpoint {

    static final String NAMESPACE = "http://medivet.tn/vetinterop";

    private final RegistreService registreService;

    public AnimalIdentityEndpoint(RegistreService registreService) {
        this.registreService = registreService;
    }

    @PayloadRoot(namespace = NAMESPACE, localPart = "VerifyAnimalIdentityRequest")
    @ResponsePayload
    public VerifyAnimalIdentityResponse verifyAnimalIdentity(@RequestPayload VerifyAnimalIdentityRequest requete) {
        RegistreService.Resultat resultat = registreService.verifier(requete.getPuce());
        VerifyAnimalIdentityResponse reponse = new VerifyAnimalIdentityResponse();
        reponse.setVerdict(resultat.verdict());
        reponse.setMessage(resultat.message());
        return reponse;
    }
}
