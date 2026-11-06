package tn.medivet.adoptanimal.client;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** Simulation du registre (profil "stub") : puce 999... = inconnue, 888... = panne, sinon vérifiée. */
@Component
@Profile("stub")
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
