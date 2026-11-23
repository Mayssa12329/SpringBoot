package com.medivet.adoptanimal.client;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class RegleEligibiliteTest {

    @ParameterizedTest
    @CsvSource({"up_to_date,healthy", "A_JOUR,BON", "À jour,EXCELLENT", "UP_TO_DATE,Healthy"})
    void animalAJourEtEnBonneSanteEstEligible(String vaccination, String sante) {
        var r = RegleEligibilite.evaluer(new PetPassAnimal(1L, "Rex", "250268500123456", vaccination, sante));
        assertThat(r.eligible()).isTrue();
        assertThat(r.motifs()).isEmpty();
    }

    @ParameterizedTest
    @CsvSource({"EXPIRED,healthy", "expired,BON", "PENDING,BON"})
    void vaccinationPasAJourRendNonEligible(String vaccination, String sante) {
        var r = RegleEligibilite.evaluer(new PetPassAnimal(1L, "Rex", null, vaccination, sante));
        assertThat(r.statut()).isEqualTo("NOT_ELIGIBLE");
        assertThat(r.motifs()).hasSize(1);
    }

    @Test
    void valeursAbsentesRendentNonEligibleAvecDeuxMotifs() {
        var r = RegleEligibilite.evaluer(new PetPassAnimal(1L, "Rex", null, null, null));
        assertThat(r.statut()).isEqualTo("NOT_ELIGIBLE");
        assertThat(r.motifs()).hasSize(2);
    }
}
