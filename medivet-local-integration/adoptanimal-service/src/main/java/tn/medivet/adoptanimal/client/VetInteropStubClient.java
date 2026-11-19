package tn.medivet.adoptanimal.client;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Simulation du registre (profil "stub") : puce 999... = inconnue, 888... = panne, sinon vérifiée. */
@Component
@ConditionalOnProperty(name = "vetinterop.stub", havingValue = "true", matchIfMissing = true)
public class VetInteropStubClient implements IdentiteClient {

    @Override
    public IdentiteVerdict verifier(String puce) {
        if (puce.startsWith("999")) {
            return IdentiteVerdict.NOT_FOUND;
        }
        if (puce.startsWith("888")) {
            return IdentiteVerdict.INDISPONIBLE;
        }
        return IdentiteVerdict.VERIFIED;
    }
}
