package tn.medivet.adoptanimal.service;

import org.junit.jupiter.api.Test;
import tn.medivet.adoptanimal.entity.StatutCandidature;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StatutCandidatureTest {

    @Test
    void transitionsAutorisees() {
        assertTrue(StatutCandidature.SOUMISE.peutPasserA(StatutCandidature.EN_EXAMEN));
        assertTrue(StatutCandidature.EN_EXAMEN.peutPasserA(StatutCandidature.ACCEPTEE));
        assertTrue(StatutCandidature.EN_EXAMEN.peutPasserA(StatutCandidature.REFUSEE));
    }

    @Test
    void transitionsInterdites() {
        assertFalse(StatutCandidature.SOUMISE.peutPasserA(StatutCandidature.ACCEPTEE));
        assertFalse(StatutCandidature.ACCEPTEE.peutPasserA(StatutCandidature.REFUSEE));
        assertFalse(StatutCandidature.REFUSEE.peutPasserA(StatutCandidature.EN_EXAMEN));
    }
}
