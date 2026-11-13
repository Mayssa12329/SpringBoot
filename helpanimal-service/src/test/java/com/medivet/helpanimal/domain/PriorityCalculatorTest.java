package com.medivet.helpanimal.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

/** RM01 : score de priorite. */
class PriorityCalculatorTest {

    private static final Instant NOW = Instant.parse("2026-11-06T10:00:00Z");
    private final PriorityCalculator calculator = new PriorityCalculator(Clock.fixed(NOW, ZoneOffset.UTC));

    private static Report report(int severity, Duration age) {
        return new Report("chien", ReportCategory.BLESSE, "test", severity, "/photos/x.png",
            48.85, 2.35, 1L, NOW.minus(age));
    }

    @Test
    void plusGraveEnPremier() {
        Report faible = report(2, Duration.ZERO);
        Report grave = report(5, Duration.ZERO);
        List<Report> list = new ArrayList<>(List.of(faible, grave));

        list.sort(calculator.byPriorityDesc());

        assertThat(list.get(0)).isSameAs(grave);
    }

    @Test
    void unPointParTrancheDe30Minutes() {
        assertThat(calculator.score(report(3, Duration.ZERO))).isEqualTo(3 + 10);
        assertThat(calculator.score(report(3, Duration.ofMinutes(29)))).isEqualTo(3 + 10);
        assertThat(calculator.score(report(3, Duration.ofMinutes(90)))).isEqualTo(3 + 3 + 10);
    }

    @Test
    void bonusDe10SansPriseEnCharge() {
        Report sansPriseEnCharge = report(3, Duration.ZERO);
        Report prisEnCharge = report(3, Duration.ZERO);
        prisEnCharge.assignTo(42L, NOW);

        assertThat(calculator.score(sansPriseEnCharge) - calculator.score(prisEnCharge)).isEqualTo(10);
    }

    @Test
    void ancienneteFaitMonterUnSignalementMoinsGrave() {
        Report ancien = report(2, Duration.ofHours(3));   // 2 + 6 + 10 = 18
        Report recent = report(5, Duration.ZERO);          // 5 + 0 + 10 = 15
        List<Report> list = new ArrayList<>(List.of(recent, ancien));

        list.sort(calculator.byPriorityDesc());

        assertThat(list.get(0)).isSameAs(ancien);
    }
}
