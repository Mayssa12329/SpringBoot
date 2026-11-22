package com.medivet.rescue.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicLong;

import com.medivet.rescue.MutableClock;
import com.medivet.rescue.model.Mission;
import com.medivet.rescue.model.MissionEventType;
import com.medivet.rescue.model.MissionStatus;
import com.medivet.rescue.repository.MissionEventRepository;
import com.medivet.rescue.repository.MissionRepository;
import com.medivet.rescue.service.MissionService.AssignResult;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/** Regles RM04 et RM05 sur une vraie base (H2). */
@SpringBootTest
@ActiveProfiles("test")
@Import(MutableClock.Config.class)
class MissionServiceTest {

    /** Chaque test travaille sur son propre signalement. */
    private static final AtomicLong REPORT = new AtomicLong(1000);

    @Autowired
    private MissionService missionService;

    @Autowired
    private MissionRepository missionRepository;

    @Autowired
    private MissionEventRepository eventRepository;

    @Autowired
    private MutableClock clock;

    private long publishNew() {
        long reportId = REPORT.incrementAndGet();
        missionService.publish(reportId, 36.8, 10.18, 4, "chien");
        return reportId;
    }

    private Mission mission(long reportId) {
        return missionRepository.findByReportId(reportId).orElseThrow();
    }

    private List<MissionEventType> events(long reportId) {
        return eventRepository.findByMissionIdOrderByOccurredAtAscIdAsc(mission(reportId).getId())
            .stream().map(e -> e.getType()).toList();
    }

    @Test
    void publicationIdempotente() {
        long reportId = publishNew();
        missionService.publish(reportId, 36.8, 10.18, 4, "chien");

        assertThat(mission(reportId).getStatus()).isEqualTo(MissionStatus.OPEN);
        assertThat(mission(reportId).getMissionId()).isEqualTo("MIS-" + reportId);
        assertThat(events(reportId)).containsExactly(MissionEventType.PUBLISHED);
    }

    @Test
    void rm04_premiereAcceptationGagne() {
        long reportId = publishNew();

        assertThat(missionService.assign(reportId, 20L, 36.8, 10.18, 4).result()).isEqualTo(AssignResult.ASSIGNED);
        assertThat(missionService.assign(reportId, 21L, 36.8, 10.18, 4).result()).isEqualTo(AssignResult.ALREADY_ASSIGNED);
        assertThat(mission(reportId).getIntervenantId()).isEqualTo(20L);
    }

    @Test
    void rm04_repriseDuMemeIntervenantResteAcceptee() {
        long reportId = publishNew();
        missionService.assign(reportId, 20L, 36.8, 10.18, 4);

        // Reprise RM13 apres un delai depasse cote HelpAnimal
        assertThat(missionService.assign(reportId, 20L, 36.8, 10.18, 4).result()).isEqualTo(AssignResult.ASSIGNED);
        assertThat(events(reportId)).containsExactly(MissionEventType.PUBLISHED, MissionEventType.ASSIGNED);
    }

    @Test
    void rm04_deuxAcceptationsSimultaneesUneSeuleReussit() throws Exception {
        long reportId = publishNew();
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        List<Callable<AssignResult>> tasks = new ArrayList<>();
        for (long intervenant : new long[] {30L, 31L}) {
            tasks.add(() -> {
                start.await();
                return missionService.assign(reportId, intervenant, 36.8, 10.18, 4).result();
            });
        }
        List<Future<AssignResult>> futures = new ArrayList<>();
        for (Callable<AssignResult> task : tasks) {
            futures.add(pool.submit(task));
        }
        start.countDown();
        List<AssignResult> results = new ArrayList<>();
        for (Future<AssignResult> future : futures) {
            results.add(future.get());
        }
        pool.shutdown();

        assertThat(results).containsExactlyInAnyOrder(AssignResult.ASSIGNED, AssignResult.ALREADY_ASSIGNED);
        assertThat(mission(reportId).getIntervenantId()).isIn(30L, 31L);
    }

    @Test
    void affectationSansPublicationPrealableCreeLaMission() {
        long reportId = REPORT.incrementAndGet();

        assertThat(missionService.assign(reportId, 20L, 36.8, 10.18, 3).result()).isEqualTo(AssignResult.ASSIGNED);
        assertThat(events(reportId)).containsExactly(MissionEventType.PUBLISHED, MissionEventType.ASSIGNED);
    }

    @Test
    void rm05_desistementRediffuseLaMission() {
        long reportId = publishNew();
        missionService.assign(reportId, 20L, 36.8, 10.18, 4);

        Mission mission = missionService.decline(reportId, 20L, "Trop loin");

        assertThat(mission.getStatus()).isEqualTo(MissionStatus.OPEN);
        assertThat(mission.getIntervenantId()).isNull();
        assertThat(mission.getReassignments()).isEqualTo(1);
        assertThat(events(reportId)).endsWith(MissionEventType.DECLINED, MissionEventType.REASSIGNED);
        // Un autre intervenant peut maintenant accepter
        assertThat(missionService.assign(reportId, 21L, 36.8, 10.18, 4).result()).isEqualTo(AssignResult.ASSIGNED);
    }

    @Test
    void rm05_seulLIntervenantAttribuePeutSeDesister() {
        long reportId = publishNew();
        missionService.assign(reportId, 20L, 36.8, 10.18, 4);

        assertThatThrownBy(() -> missionService.decline(reportId, 21L, null))
            .isInstanceOf(MissionStateException.class);
        assertThatThrownBy(() -> missionService.decline(REPORT.incrementAndGet(), 20L, null))
            .isInstanceOf(MissionNotFoundException.class);
    }

    @Test
    void rm05_escaladeApresTroisReattributions() {
        long reportId = publishNew();
        for (long intervenant = 40; intervenant < 43; intervenant++) {
            missionService.assign(reportId, intervenant, 36.8, 10.18, 4);
            missionService.decline(reportId, intervenant, "indisponible");
        }
        assertThat(mission(reportId).getStatus()).isEqualTo(MissionStatus.OPEN);
        assertThat(mission(reportId).getReassignments()).isEqualTo(3);

        missionService.assign(reportId, 43L, 36.8, 10.18, 4);
        missionService.decline(reportId, 43L, "indisponible");

        assertThat(mission(reportId).getStatus()).isEqualTo(MissionStatus.ESCALATED);
        assertThat(events(reportId)).last().isEqualTo(MissionEventType.ESCALATED);
        assertThat(missionService.assign(reportId, 44L, 36.8, 10.18, 4).result()).isEqualTo(AssignResult.REJECTED);
    }

    @Test
    void rm05_sansReponseApres15MinutesLaMissionEstReattribuee() {
        long reportId = publishNew();
        missionService.assign(reportId, 20L, 36.8, 10.18, 4);

        clock.advance(Duration.ofMinutes(14));
        missionService.reassignUnanswered();
        assertThat(mission(reportId).getStatus()).isEqualTo(MissionStatus.ASSIGNED);

        clock.advance(Duration.ofMinutes(2));
        missionService.reassignUnanswered();
        assertThat(mission(reportId).getStatus()).isEqualTo(MissionStatus.OPEN);
        assertThat(events(reportId)).last().isEqualTo(MissionEventType.REASSIGNED);
    }

    @Test
    void rm05_uneInterventionDemarreeNEstPasReattribuee() {
        long reportId = publishNew();
        missionService.assign(reportId, 20L, 36.8, 10.18, 4);
        missionService.updateStatus(reportId, 20L, MissionStatus.IN_PROGRESS);

        clock.advance(Duration.ofMinutes(30));
        missionService.reassignUnanswered();

        assertThat(mission(reportId).getStatus()).isEqualTo(MissionStatus.IN_PROGRESS);
    }

    @Test
    void suiviJusquATermineEtTransitionsInvalides() {
        long reportId = publishNew();
        assertThatThrownBy(() -> missionService.updateStatus(reportId, 20L, MissionStatus.COMPLETED))
            .isInstanceOf(MissionStateException.class);

        missionService.assign(reportId, 20L, 36.8, 10.18, 4);
        assertThatThrownBy(() -> missionService.updateStatus(reportId, 21L, MissionStatus.IN_PROGRESS))
            .isInstanceOf(MissionStateException.class);

        missionService.updateStatus(reportId, 20L, MissionStatus.IN_PROGRESS);
        missionService.updateStatus(reportId, 20L, MissionStatus.COMPLETED);
        // Reprise : deja a jour, sans nouvel evenement
        missionService.updateStatus(reportId, 20L, MissionStatus.COMPLETED);

        assertThat(mission(reportId).getStatus()).isEqualTo(MissionStatus.COMPLETED);
        assertThat(events(reportId)).containsExactly(MissionEventType.PUBLISHED, MissionEventType.ASSIGNED,
            MissionEventType.IN_PROGRESS, MissionEventType.COMPLETED);
    }
}
