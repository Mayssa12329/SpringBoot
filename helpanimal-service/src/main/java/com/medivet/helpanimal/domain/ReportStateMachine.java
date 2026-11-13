package com.medivet.helpanimal.domain;

import java.time.Instant;
import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import com.medivet.helpanimal.exception.InvalidTransitionException;
import org.springframework.stereotype.Component;

/**
 * RM03 : cycle de vie d'un signalement.
 * <pre>
 * Nouveau -> Qualifie -> Attribue -> En cours -> Termine
 * Rejete ou Masque possibles seulement depuis Nouveau ou Qualifie.
 * </pre>
 * Toute autre transition est refusee (409) et l'etat reste inchange.
 */
@Component
public class ReportStateMachine {

    private static final Map<ReportStatus, Set<ReportStatus>> ALLOWED = new EnumMap<>(ReportStatus.class);

    static {
        ALLOWED.put(ReportStatus.NOUVEAU,
            EnumSet.of(ReportStatus.QUALIFIE, ReportStatus.REJETE, ReportStatus.MASQUE));
        ALLOWED.put(ReportStatus.QUALIFIE,
            EnumSet.of(ReportStatus.ATTRIBUE, ReportStatus.REJETE, ReportStatus.MASQUE));
        ALLOWED.put(ReportStatus.ATTRIBUE, EnumSet.of(ReportStatus.EN_COURS));
        ALLOWED.put(ReportStatus.EN_COURS, EnumSet.of(ReportStatus.TERMINE));
        ALLOWED.put(ReportStatus.TERMINE, EnumSet.noneOf(ReportStatus.class));
        ALLOWED.put(ReportStatus.REJETE, EnumSet.noneOf(ReportStatus.class));
        ALLOWED.put(ReportStatus.MASQUE, EnumSet.noneOf(ReportStatus.class));
    }

    public boolean canTransition(ReportStatus from, ReportStatus to) {
        return ALLOWED.getOrDefault(from, Set.of()).contains(to);
    }

    public Set<ReportStatus> nextStates(ReportStatus from) {
        return Collections.unmodifiableSet(ALLOWED.getOrDefault(from, EnumSet.noneOf(ReportStatus.class)));
    }

    /** Verifie la transition sans rien modifier. */
    public void check(ReportStatus from, ReportStatus to) {
        if (!canTransition(from, to)) {
            throw new InvalidTransitionException(
                "Transition interdite : " + from + " -> " + to + ". Etats possibles : " + nextStates(from));
        }
    }

    /**
     * Applique la transition et renvoie la ligne d'historique a enregistrer.
     * Si la transition est interdite, le signalement n'est pas modifie.
     */
    public ReportStatusHistory transition(Report report, ReportStatus to, Long actorId, String comment, Instant now) {
        ReportStatus from = report.getStatus();
        check(from, to);
        report.setStatus(to, now);
        return new ReportStatusHistory(report.getId(), from, to, actorId, comment, now);
    }
}
