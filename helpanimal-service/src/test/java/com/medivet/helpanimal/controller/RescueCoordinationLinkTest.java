package com.medivet.helpanimal.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.BooleanSupplier;

import javax.imageio.ImageIO;

import com.jayway.jsonpath.JsonPath;
import com.medivet.helpanimal.model.ReportStatus;
import com.medivet.helpanimal.repository.AuditLogRepository;
import com.medivet.helpanimal.repository.ReportRepository;
import com.medivet.helpanimal.repository.ReportStatusHistoryRepository;
import com.medivet.helpanimal.service.MissionReassignmentService;
import com.medivet.helpanimal.security.Role;
import com.medivet.helpanimal.support.FakeRescueCoordination;
import com.medivet.rescue.grpc.MissionEvent;
import com.medivet.rescue.grpc.MissionEventType;
import com.medivet.rescue.grpc.MissionStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

/** Lien HelpAnimal -> RescueCoordination (gRPC) : affectation, desistement, flux d'evenements, panne. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RescueCoordinationLinkTest {

    private static final AtomicInteger AREA = new AtomicInteger();

    @Autowired
    private MockMvc mvc;

    @Autowired
    private FakeRescueCoordination.FakeService rescue;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ReportStatusHistoryRepository historyRepository;

    @Autowired
    private MissionReassignmentService reassignmentService;

    @AfterEach
    void restore() {
        rescue.setUnavailable(false);
    }

    private static RequestPostProcessor as(long n, Role role) {
        return user("helpanimal-test-" + n + "@medivet.test").roles(role.name());
    }

    /** Signalement qualifie, pret a etre accepte. */
    private long qualifiedReport() throws Exception {
        int n = AREA.incrementAndGet();
        BufferedImage image = new BufferedImage(20, 20, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream png = new ByteArrayOutputStream();
        ImageIO.write(image, "png", png);
        String json = mvc.perform(multipart("/api/v1/reports")
                .file(new MockMultipartFile("photo", "chien.png", "image/png", png.toByteArray()))
                .param("species", "chien").param("category", "BLESSE").param("description", "Chien blesse")
                .param("severity", "4")
                .param("latitude", String.valueOf(30.0 + n * 0.1)).param("longitude", String.valueOf(5.0 + n * 0.1))
                .with(as(1, Role.UTILISATEUR)))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        long id = ((Number) JsonPath.read(json, "$.id")).longValue();
        changeStatus(id, "QUALIFIE", 7);
        return id;
    }

    private void changeStatus(long id, String target, long vet) throws Exception {
        mvc.perform(patch("/api/v1/reports/{id}/status", id).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"" + target + "\"}").with(as(vet, Role.VETERINAIRE)))
            .andExpect(status().isOk());
    }

    private ReportStatus statusOf(long id) {
        return reportRepository.findById(id).orElseThrow().getStatus();
    }

    /** Les appels de synchronisation et le flux sont asynchrones. */
    private static void await(BooleanSupplier condition) throws InterruptedException {
        for (int i = 0; i < 100 && !condition.getAsBoolean(); i++) {
            Thread.sleep(50);
        }
        assertThat(condition.getAsBoolean()).as("condition atteinte dans les 5 s").isTrue();
    }

    @Test
    void qualificationDiffuseLaMissionAuxIntervenants() throws Exception {
        long id = qualifiedReport();
        await(() -> rescue.isPublished(id));
    }

    @Test
    void acceptationConfirmeeParRescueCoordination() throws Exception {
        long id = qualifiedReport();

        mvc.perform(post("/api/v1/reports/{id}/accept", id).with(as(20, Role.VETERINAIRE)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ATTRIBUE"))
            .andExpect(jsonPath("$.history[-1].comment").value("Mission acceptee (MIS-" + id + ")"));
        mvc.perform(post("/api/v1/reports/{id}/accept", id).with(as(21, Role.VETERINAIRE)))
            .andExpect(status().isConflict());
    }

    @Test
    void suiviTransmisJusquATermine() throws Exception {
        long id = qualifiedReport();
        mvc.perform(post("/api/v1/reports/{id}/accept", id).with(as(20, Role.VETERINAIRE))).andExpect(status().isOk());
        changeStatus(id, "EN_COURS", 20);
        changeStatus(id, "TERMINE", 20);

        await(() -> rescue.statusUpdates().contains(id + ":" + MissionStatus.MISSION_COMPLETED));
        assertThat(rescue.statusUpdates()).contains(id + ":" + MissionStatus.MISSION_IN_PROGRESS);
    }

    /** La panne ouvre le circuit breaker (30 s) : contexte Spring neuf ensuite pour les autres tests. */
    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.AFTER_METHOD)
    void rm13_rescueCoordinationEnPanne503EtSignalementResteQualifie() throws Exception {
        long id = qualifiedReport();
        rescue.setUnavailable(true);

        mvc.perform(post("/api/v1/reports/{id}/accept", id).with(as(20, Role.VETERINAIRE)))
            .andExpect(status().isServiceUnavailable());
        assertThat(statusOf(id)).isEqualTo(ReportStatus.QUALIFIE);
    }

    @Test
    void us46_desistementRemetLaMissionEnDiffusion() throws Exception {
        long id = qualifiedReport();
        mvc.perform(post("/api/v1/reports/{id}/accept", id).with(as(20, Role.VETERINAIRE))).andExpect(status().isOk());

        mvc.perform(post("/api/v1/reports/{id}/decline", id).contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"Panne de vehicule\"}").with(as(21, Role.VETERINAIRE)))
            .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/reports/{id}/decline", id).contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"Panne de vehicule\"}").with(as(20, Role.VETERINAIRE)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("QUALIFIE"))
            .andExpect(jsonPath("$.assigneeId").doesNotExist());

        // Un autre intervenant peut maintenant accepter la mission rediffusee
        mvc.perform(post("/api/v1/reports/{id}/accept", id).with(as(21, Role.VETERINAIRE)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.assigneeId").value(21));
    }

    @Test
    void rm05_reattributionRecueParLeFlux() throws Exception {
        long id = qualifiedReport();
        mvc.perform(post("/api/v1/reports/{id}/accept", id).with(as(20, Role.VETERINAIRE))).andExpect(status().isOk());
        await(() -> rescue.watcherCount() > 0);

        // RescueCoordination : 15 min sans reponse de l'intervenant
        rescue.emit(MissionEvent.newBuilder().setMissionId("MIS-" + id).setReportId(String.valueOf(id))
            .setType(MissionEventType.EVENT_REASSIGNED).setStatus(MissionStatus.MISSION_OPEN)
            .setMessage("Mission rediffusee sans reponse de l'intervenant 20 depuis 15 min").build());

        await(() -> statusOf(id) == ReportStatus.QUALIFIE);
        assertThat(reportRepository.findById(id).orElseThrow().getAssigneeId()).isNull();
    }

    @Test
    void rm05_escaladeJournaliseePourLAdministrateur() throws Exception {
        long id = qualifiedReport();
        mvc.perform(post("/api/v1/reports/{id}/accept", id).with(as(20, Role.VETERINAIRE))).andExpect(status().isOk());
        rescue.escalateNextDecline();

        mvc.perform(post("/api/v1/reports/{id}/decline", id).with(as(20, Role.VETERINAIRE)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("QUALIFIE"));

        assertThat(auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtAsc("REPORT", id))
            .anySatisfy(log -> assertThat(log.getAction()).isEqualTo("MISSION_ESCALATED"));
    }

    /** Reponse au desistement et evenement du flux traites en meme temps, sur deux fils. */
    @Test
    void rm05_desistementEtFluxSimultanesSansErreur() throws Exception {
        for (int round = 0; round < 5; round++) {
            long id = qualifiedReport();
            mvc.perform(post("/api/v1/reports/{id}/accept", id).with(as(20, Role.VETERINAIRE))).andExpect(status().isOk());

            CountDownLatch start = new CountDownLatch(1);
            ExecutorService pool = Executors.newFixedThreadPool(2);
            List<Future<?>> tasks = new ArrayList<>();
            for (Long actor : new Long[] {20L, null}) {
                tasks.add(pool.submit(() -> {
                    start.await();
                    reassignmentService.release(id, false, "Mission rediffusee apres desistement", actor);
                    return null;
                }));
            }
            start.countDown();
            for (Future<?> task : tasks) {
                task.get(); // aucune exception : pas de 409 "modifie en parallele"
            }
            pool.shutdown();

            assertThat(statusOf(id)).isEqualTo(ReportStatus.QUALIFIE);
            assertThat(historyRepository.findByReportIdOrderByChangedAtAscIdAsc(id))
                .filteredOn(h -> h.getFromStatus() == ReportStatus.ATTRIBUE).hasSize(1);
        }
    }

    /** Canal de dispatch (gRPC bidirectionnel) : acceptation puis demarrage faits hors de l'API REST. */
    @Test
    void dispatch_acceptationEtDemarrageRecusParLeFlux() throws Exception {
        long id = qualifiedReport();
        await(() -> rescue.watcherCount() > 0);

        rescue.emit(MissionEvent.newBuilder().setMissionId("MIS-" + id).setReportId(String.valueOf(id))
            .setIntervenantId("22").setType(MissionEventType.EVENT_ASSIGNED).setStatus(MissionStatus.MISSION_ASSIGNED)
            .setMessage("Mission acceptee par l'intervenant 22").build());
        await(() -> statusOf(id) == ReportStatus.ATTRIBUE);
        assertThat(reportRepository.findById(id).orElseThrow().getAssigneeId()).isEqualTo(22L);
        // L'evenement recu une seconde fois ne change rien
        rescue.emit(MissionEvent.newBuilder().setMissionId("MIS-" + id).setReportId(String.valueOf(id))
            .setIntervenantId("23").setType(MissionEventType.EVENT_ASSIGNED).setStatus(MissionStatus.MISSION_ASSIGNED).build());

        // Un demarrage annonce pour un autre intervenant est ignore
        rescue.emit(MissionEvent.newBuilder().setMissionId("MIS-" + id).setReportId(String.valueOf(id))
            .setIntervenantId("23").setType(MissionEventType.EVENT_IN_PROGRESS).setStatus(MissionStatus.MISSION_IN_PROGRESS).build());
        rescue.emit(MissionEvent.newBuilder().setMissionId("MIS-" + id).setReportId(String.valueOf(id))
            .setIntervenantId("22").setType(MissionEventType.EVENT_IN_PROGRESS).setStatus(MissionStatus.MISSION_IN_PROGRESS).build());
        await(() -> statusOf(id) == ReportStatus.EN_COURS);
        assertThat(reportRepository.findById(id).orElseThrow().getAssigneeId()).isEqualTo(22L);

        // L'intervenant termine ensuite par l'API REST, comme d'habitude
        changeStatus(id, "TERMINE", 22);
    }

    @Test
    void retourManuelAQualifieRefuse() throws Exception {
        long id = qualifiedReport();
        mvc.perform(post("/api/v1/reports/{id}/accept", id).with(as(20, Role.VETERINAIRE))).andExpect(status().isOk());

        mvc.perform(patch("/api/v1/reports/{id}/status", id).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"QUALIFIE\"}").with(as(20, Role.VETERINAIRE)))
            .andExpect(status().isConflict());
        mvc.perform(get("/api/v1/reports/{id}", id).with(as(1, Role.UTILISATEUR)))
            .andExpect(jsonPath("$.status").value("ATTRIBUE"));
    }
}
