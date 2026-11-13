package com.medivet.helpanimal.domain;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;

import org.springframework.stereotype.Component;

/**
 * RM01 : score de priorite d'un signalement.
 * <pre>
 * score = gravite (1 a 5)
 *       + 1 point par tranche de 30 min d'anciennete
 *       + 10 si aucune prise en charge
 * </pre>
 * Les listes sont triees par score decroissant (puis du plus ancien au plus recent).
 */
@Component
public class PriorityCalculator {

    static final int MINUTES_PER_POINT = 30;
    static final int NOT_TAKEN_BONUS = 10;

    private final Clock clock;

    public PriorityCalculator(Clock clock) {
        this.clock = clock;
    }

    public int score(Report report) {
        Instant now = clock.instant();
        long ageMinutes = Math.max(0, Duration.between(report.getCreatedAt(), now).toMinutes());
        int agePoints = (int) (ageMinutes / MINUTES_PER_POINT);
        int bonus = report.isTakenInCharge() ? 0 : NOT_TAKEN_BONUS;
        return report.getSeverity() + agePoints + bonus;
    }

    /** Comparateur : le plus prioritaire en premier. */
    public Comparator<Report> byPriorityDesc() {
        return Comparator.comparingInt(this::score).reversed()
            .thenComparing(Report::getCreatedAt);
    }
}
