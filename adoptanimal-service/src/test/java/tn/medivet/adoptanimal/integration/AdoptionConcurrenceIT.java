package tn.medivet.adoptanimal.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tn.medivet.adoptanimal.entity.Annonce;
import tn.medivet.adoptanimal.entity.Candidature;
import tn.medivet.adoptanimal.entity.Rencontre;
import tn.medivet.adoptanimal.entity.StatutAnnonce;
import tn.medivet.adoptanimal.entity.StatutCandidature;
import tn.medivet.adoptanimal.entity.StatutRencontre;
import tn.medivet.adoptanimal.repository.AdoptionRepository;
import tn.medivet.adoptanimal.repository.AnnonceRepository;
import tn.medivet.adoptanimal.repository.CandidatureRepository;
import tn.medivet.adoptanimal.repository.RencontreRepository;
import tn.medivet.adoptanimal.service.AdoptionService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** RM12 : deux finalisations simultanées -> une seule réussit (Docker requis, lancé par mvn verify). */
@SpringBootTest
@Testcontainers
@ActiveProfiles("stub")
class AdoptionConcurrenceIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired AdoptionService adoptionService;
    @Autowired AnnonceRepository annonceRepository;
    @Autowired CandidatureRepository candidatureRepository;
    @Autowired RencontreRepository rencontreRepository;
    @Autowired AdoptionRepository adoptionRepository;

    @Test
    void deuxFinalisationsSimultanees_uneSeuleReussit() throws Exception {
        Annonce annonce = new Annonce();
        annonce.setAnimalId(1L);
        annonce.setPuce("250268500123456");
        annonce.setNom("Rex");
        annonce.setEspece("CHIEN");
        annonce.setRefugeId(10L);
        annonce.setStatut(StatutAnnonce.ACTIVE);
        final Long annonceId = annonceRepository.save(annonce).getId();

        final Long c1 = candidatureAcceptee(annonceId, 100L);
        final Long c2 = candidatureAcceptee(annonceId, 101L);

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch depart = new CountDownLatch(1);
        Callable<Boolean> tache1 = () -> tenter(depart, annonceId, c1);
        Callable<Boolean> tache2 = () -> tenter(depart, annonceId, c2);
        List<Future<Boolean>> resultats = List.of(pool.submit(tache1), pool.submit(tache2));
        depart.countDown();

        long reussites = 0;
        for (Future<Boolean> f : resultats) {
            if (f.get()) {
                reussites++;
            }
        }
        pool.shutdown();

        assertEquals(1, reussites, "une seule finalisation doit réussir");
        assertEquals(1, adoptionRepository.count());
    }

    private boolean tenter(CountDownLatch depart, Long annonceId, Long candidatureId) throws InterruptedException {
        depart.await();
        try {
            adoptionService.finaliser(annonceId, candidatureId, null);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Long candidatureAcceptee(Long annonceId, Long candidatId) {
        Candidature c = new Candidature();
        c.setAnnonceId(annonceId);
        c.setCandidatId(candidatId);
        c.setStatut(StatutCandidature.ACCEPTEE);
        Long id = candidatureRepository.save(c).getId();

        Rencontre r = new Rencontre();
        r.setCandidatureId(id);
        r.setDateRencontre(LocalDateTime.now().minusDays(1));
        r.setStatut(StatutRencontre.EFFECTUEE);
        rencontreRepository.save(r);
        return id;
    }
}
