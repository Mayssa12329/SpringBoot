package tn.medivet.adoptanimal.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.ws.client.core.WebServiceTemplate;
import org.springframework.ws.soap.client.SoapFaultClientException;
import tn.medivet.adoptanimal.client.soap.generated.VerifyAnimalIdentityRequest;
import tn.medivet.adoptanimal.client.soap.generated.VerifyAnimalIdentityResponse;
import tn.medivet.adoptanimal.exception.RequeteSoapInvalideException;

/**
 * Client SOAP vers VetInterop (RM10, RM13).
 * - puce inconnue = résultat métier (NOT_FOUND), pas une erreur ;
 * - SOAP Fault client (requête hors XSD) = erreur de contrat, pas de reprise ;
 * - SOAP Fault serveur, timeout, panne = reprises puis circuit breaker puis repli INDISPONIBLE.
 */
@Slf4j
@Component
@Profile("!stub")
public class VetInteropSoapClient implements IdentiteClient {

    private final WebServiceTemplate webServiceTemplate;

    public VetInteropSoapClient(WebServiceTemplate vetInteropWebServiceTemplate) {
        this.webServiceTemplate = vetInteropWebServiceTemplate;
    }

    @Override
    @Retry(name = "vetinterop", fallbackMethod = "repli")
    @CircuitBreaker(name = "vetinterop")
    public IdentiteVerdict verifier(String puce) {
        VerifyAnimalIdentityRequest requete = new VerifyAnimalIdentityRequest();
        requete.setPuce(puce);
        try {
            VerifyAnimalIdentityResponse reponse =
                    (VerifyAnimalIdentityResponse) webServiceTemplate.marshalSendAndReceive(requete);
            if (reponse == null || reponse.getVerdict() == null) {
                return IdentiteVerdict.UNDETERMINED;
            }
            return IdentiteVerdict.valueOf(reponse.getVerdict().value());
        } catch (SoapFaultClientException fault) {
            String code = fault.getFaultCode() != null ? fault.getFaultCode().getLocalPart() : "";
            if ("Client".equals(code) || "Sender".equals(code)) {
                throw new RequeteSoapInvalideException(fault.getFaultStringOrReason());
            }
            throw fault; // faute serveur : sera réessayée
        }
    }

    /** Repli : le registre est injoignable, l'annonce passera en VERIFICATION_EN_ATTENTE. */
    public IdentiteVerdict repli(String puce, Throwable cause) {
        log.warn("VetInterop indisponible : {}", cause.toString());
        return IdentiteVerdict.INDISPONIBLE;
    }

    /** Surcharge plus spécifique : une requête hors contrat n'est pas masquée par le repli. */
    public IdentiteVerdict repli(String puce, RequeteSoapInvalideException cause) {
        throw cause;
    }
}
