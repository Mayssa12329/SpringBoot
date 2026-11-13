package com.medivet.helpanimal.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.medivet.helpanimal.exception.InvalidTransitionException;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.api.Test;

/** RM03 : toutes les paires (etat, etat) sont testees. */
class ReportStateMachineTest {

    private static final Map<ReportStatus, Set<ReportStatus>> EXPECTED = Map.of(
        ReportStatus.NOUVEAU, Set.of(ReportStatus.QUALIFIE, ReportStatus.REJETE, ReportStatus.MASQUE),
        ReportStatus.QUALIFIE, Set.of(ReportStatus.ATTRIBUE, ReportStatus.REJETE, ReportStatus.MASQUE),
        ReportStatus.ATTRIBUE, Set.of(ReportStatus.EN_COURS),
        ReportStatus.EN_COURS, Set.of(ReportStatus.TERMINE),
        ReportStatus.TERMINE, Set.of(),
        ReportStatus.REJETE, Set.of(),
        ReportStatus.MASQUE, Set.of());

    private final ReportStateMachine machine = new ReportStateMachine();

    static List<Arguments> allPairs() {
        List<Arguments> pairs = new ArrayList<>();
        for (ReportStatus from : ReportStatus.values()) {
            for (ReportStatus to : ReportStatus.values()) {
                pairs.add(Arguments.of(from, to, EXPECTED.get(from).contains(to)));
            }
        }
        return pairs;
    }

    @ParameterizedTest(name = "{0} -> {1} autorise = {2}")
    @MethodSource("allPairs")
    void transitions(ReportStatus from, ReportStatus to, boolean allowed) {
        assertThat(machine.canTransition(from, to)).isEqualTo(allowed);
    }

    @Test
    void sautNouveauVersTermineRefuseEtEtatInchange() {
        Report report = new Report("chat", ReportCategory.BLESSE, "test", 3, "/photos/x.png",
            48.85, 2.35, 1L, Instant.now());

        assertThatThrownBy(() -> machine.transition(report, ReportStatus.TERMINE, 1L, null, Instant.now()))
            .isInstanceOf(InvalidTransitionException.class);
        assertThat(report.getStatus()).isEqualTo(ReportStatus.NOUVEAU);
    }

    @Test
    void cheminCompletJusquaTermine() {
        Report report = new Report("chat", ReportCategory.BLESSE, "test", 3, "/photos/x.png",
            48.85, 2.35, 1L, Instant.now());
        for (ReportStatus next : List.of(ReportStatus.QUALIFIE, ReportStatus.ATTRIBUE,
                ReportStatus.EN_COURS, ReportStatus.TERMINE)) {
            ReportStatusHistory h = machine.transition(report, next, 1L, null, Instant.now());
            assertThat(h.getToStatus()).isEqualTo(next);
        }
        assertThat(report.getStatus()).isEqualTo(ReportStatus.TERMINE);
    }
}
