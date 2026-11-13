package com.medivet.helpanimal.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import javax.imageio.ImageIO;

import com.jayway.jsonpath.JsonPath;
import com.medivet.helpanimal.exception.MissionAlreadyAssignedException;
import com.medivet.helpanimal.repository.AuditLogRepository;
import com.medivet.helpanimal.security.CurrentUser;
import com.medivet.helpanimal.security.Role;
import com.medivet.helpanimal.service.AcceptMissionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

/**
 * Tests de bout en bout de l'API (US19 a US25) avec la vraie base H2,
 * la vraie securite et le stub gRPC demarre sur un port aleatoire.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReportApiIntegrationTest {

    private static final AtomicInteger AREA = new AtomicInteger();

    @Autowired
    private MockMvc mvc;

    @Autowired
    private AcceptMissionService acceptMissionService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    // ------------------------------------------------------------------ outils

    private static RequestPostProcessor as(long userId, Role role) {
        return jwt().jwt(j -> j.subject(String.valueOf(userId)))
            .authorities(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    private static byte[] png() throws Exception {
        BufferedImage image = new BufferedImage(20, 20, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }

    private static MockMultipartFile photo() throws Exception {
        return new MockMultipartFile("photo", "chien.png", "image/png", png());
    }

    /** Chaque test travaille dans sa propre zone pour ne pas declencher RM02 par accident. */
    private static double[] newArea() {
        int n = AREA.incrementAndGet();
        return new double[] {44.0 + n * 0.1, 1.0 + n * 0.1};
    }

    private long createReport(long userId, String species, double lat, double lng, int severity) throws Exception {
        String json = mvc.perform(multipart("/api/reports")
                .file(photo())
                .param("species", species)
                .param("category", "BLESSE")
                .param("description", "Animal blesse")
                .param("severity", String.valueOf(severity))
                .param("latitude", String.valueOf(lat))
                .param("longitude", String.valueOf(lng))
                .with(as(userId, Role.CITOYEN)))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(json, "$.id")).longValue();
    }

    private void setStatus(long id, String status, long userId, Role role) throws Exception {
        mvc.perform(patch("/api/reports/{id}/status", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"" + status + "\",\"comment\":\"test\"}")
                .with(as(userId, role)))
            .andExpect(status().isOk());
    }

    // ------------------------------------------------------------------ US19

    @Test
    void us19_creationAvecPhoto() throws Exception {
        double[] p = newArea();
        mvc.perform(multipart("/api/reports")
                .file(photo())
                .param("species", "Chien")
                .param("category", "BLESSE")
                .param("description", "Chien blesse a la patte")
                .param("severity", "4")
                .param("latitude", String.valueOf(p[0]))
                .param("longitude", String.valueOf(p[1]))
                .with(as(1, Role.CITOYEN)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("NOUVEAU"))
            .andExpect(jsonPath("$.species").value("chien"))
            .andExpect(jsonPath("$.photoUrl").value(org.hamcrest.Matchers.startsWith("/photos/")))
            .andExpect(jsonPath("$.history", hasSize(1)));
    }

    @Test
    void us19_pdfRefuse() throws Exception {
        double[] p = newArea();
        MockMultipartFile pdf = new MockMultipartFile("photo", "doc.pdf", "application/pdf", new byte[] {1, 2, 3});
        mvc.perform(multipart("/api/reports").file(pdf)
                .param("species", "chat").param("category", "BLESSE").param("description", "x")
                .param("severity", "3").param("latitude", String.valueOf(p[0])).param("longitude", String.valueOf(p[1]))
                .with(as(1, Role.CITOYEN)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void us19_faussePhotoRefusee() throws Exception {
        double[] p = newArea();
        MockMultipartFile fake = new MockMultipartFile("photo", "x.png", "image/png", "pas une image".getBytes());
        mvc.perform(multipart("/api/reports").file(fake)
                .param("species", "chat").param("category", "BLESSE").param("description", "x")
                .param("severity", "3").param("latitude", String.valueOf(p[0])).param("longitude", String.valueOf(p[1]))
                .with(as(1, Role.CITOYEN)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void us19_photoTropLourde413() throws Exception {
        double[] p = newArea();
        MockMultipartFile big = new MockMultipartFile("photo", "big.png", "image/png", new byte[6 * 1024 * 1024]);
        mvc.perform(multipart("/api/reports").file(big)
                .param("species", "chat").param("category", "BLESSE").param("description", "x")
                .param("severity", "3").param("latitude", String.valueOf(p[0])).param("longitude", String.valueOf(p[1]))
                .with(as(1, Role.CITOYEN)))
            .andExpect(status().isPayloadTooLarge());
    }

    @Test
    void us19_photoManquante400() throws Exception {
        double[] p = newArea();
        mvc.perform(multipart("/api/reports")
                .param("species", "chat").param("category", "BLESSE").param("description", "x")
                .param("severity", "3").param("latitude", String.valueOf(p[0])).param("longitude", String.valueOf(p[1]))
                .with(as(1, Role.CITOYEN)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void sansJeton401() throws Exception {
        mvc.perform(get("/api/reports")).andExpect(status().isUnauthorized());
    }

    /** Verifie la chaine complete : jeton HS256 signe -> decodage -> roles. */
    @Test
    void jetonDeDevUtilisableCommeUnVraiJeton() throws Exception {
        String json = mvc.perform(get("/api/dev/token").param("userId", "5").param("roles", "BENEVOLE"))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();
        String token = JsonPath.read(json, "$.token");

        mvc.perform(get("/api/reports/nearby").param("lat", "45").param("lng", "2")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk());
    }

    // ------------------------------------------------------------------ US20 + RM02

    @Test
    void us20_latitudeInvalide400() throws Exception {
        mvc.perform(multipart("/api/reports").file(photo())
                .param("species", "chat").param("category", "BLESSE").param("description", "x")
                .param("severity", "3").param("latitude", "120").param("longitude", "2")
                .with(as(1, Role.CITOYEN)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.details.fields.latitude").exists());
    }

    @Test
    void us20_positionCorrigeeParLAuteur() throws Exception {
        double[] p = newArea();
        long id = createReport(5, "chien", p[0], p[1], 3);

        mvc.perform(patch("/api/reports/{id}/location", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"latitude\":" + (p[0] + 0.001) + ",\"longitude\":" + p[1] + "}")
                .with(as(5, Role.CITOYEN)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.latitude").value(p[0] + 0.001));

        mvc.perform(patch("/api/reports/{id}/location", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"latitude\":" + p[0] + ",\"longitude\":" + p[1] + "}")
                .with(as(6, Role.CITOYEN)))
            .andExpect(status().isForbidden());
    }

    @Test
    void rm02_doublonA50MetresRefuse() throws Exception {
        double[] p = newArea();
        long existing = createReport(1, "chien", p[0], p[1], 3);
        double lat50m = p[0] + 50.0 / 111_320;

        mvc.perform(multipart("/api/reports").file(photo())
                .param("species", "chien").param("category", "BLESSE").param("description", "meme chien")
                .param("severity", "3").param("latitude", String.valueOf(lat50m)).param("longitude", String.valueOf(p[1]))
                .with(as(2, Role.CITOYEN)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.details.existingReportId").value(existing));
    }

    @Test
    void rm02_pasDeDoublonA150MetresNiAutreEspece() throws Exception {
        double[] p = newArea();
        createReport(1, "chien", p[0], p[1], 3);

        createReport(2, "chien", p[0] + 150.0 / 111_320, p[1], 3);
        createReport(3, "chat", p[0], p[1], 3);
    }

    @Test
    void rm02_deplacementSurUnSignalementActifRefuse() throws Exception {
        double[] p = newArea();
        long existing = createReport(1, "chien", p[0], p[1], 3);
        double farLat = p[0] + 0.01;
        long moved = createReport(1, "chien", farLat, p[1], 3);

        mvc.perform(patch("/api/reports/{id}/location", moved)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"latitude\":" + p[0] + ",\"longitude\":" + p[1] + "}")
                .with(as(1, Role.CITOYEN)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.details.existingReportId").value(existing));

        mvc.perform(get("/api/reports/{id}", moved).with(as(1, Role.CITOYEN)))
            .andExpect(jsonPath("$.latitude").value(farLat));
    }

    @Test
    void rm02_unSignalementNEstPasSonPropreDoublon() throws Exception {
        double[] p = newArea();
        long id = createReport(1, "chien", p[0], p[1], 3);
        double lat20m = p[0] + 20.0 / 111_320;

        mvc.perform(patch("/api/reports/{id}/location", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"latitude\":" + lat20m + ",\"longitude\":" + p[1] + "}")
                .with(as(1, Role.CITOYEN)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.latitude").value(lat20m));
    }

    // ------------------------------------------------------------------ US21 + RM01

    @Test
    void us21_carteTrieeParPrioriteEtSansMasques() throws Exception {
        double[] p = newArea();
        long faible = createReport(1, "lapin", p[0], p[1], 2);
        long grave = createReport(1, "chat", p[0] + 0.01, p[1], 5);
        long masque = createReport(1, "oiseau", p[0] + 0.02, p[1], 5);
        mvc.perform(patch("/api/admin/reports/{id}/hide", masque)
                .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"abus\"}")
                .with(as(99, Role.ADMIN)))
            .andExpect(status().isOk());

        String bbox = (p[0] - 0.05) + "," + (p[1] - 0.05) + "," + (p[0] + 0.05) + "," + (p[1] + 0.05);
        mvc.perform(get("/api/reports").param("bbox", bbox).with(as(1, Role.CITOYEN)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].id").value(grave))
            .andExpect(jsonPath("$[1].id").value(faible));

        mvc.perform(get("/api/reports").param("bbox", bbox).param("species", "chat").with(as(1, Role.CITOYEN)))
            .andExpect(jsonPath("$", hasSize(1)));
    }

    // ------------------------------------------------------------------ US22

    @Test
    void us22_procheFiltreParDistance() throws Exception {
        double[] p = newArea();
        long pres = createReport(1, "chien", p[0] + 0.01, p[1], 3);      // ~1,1 km
        createReport(1, "chat", p[0] + 0.08, p[1], 3);                   // ~8,9 km

        mvc.perform(get("/api/reports/nearby")
                .param("lat", String.valueOf(p[0])).param("lng", String.valueOf(p[1])).param("radiusKm", "5")
                .with(as(7, Role.BENEVOLE)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].id").value(pres))
            .andExpect(jsonPath("$[0].distanceMeters").exists());
    }

    @Test
    void us22_citoyenInterdit() throws Exception {
        mvc.perform(get("/api/reports/nearby").param("lat", "45").param("lng", "2").with(as(1, Role.CITOYEN)))
            .andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------------ US23 + RM04

    @Test
    void us23_accepterUneMissionQualifiee() throws Exception {
        double[] p = newArea();
        long id = createReport(1, "chien", p[0], p[1], 4);
        setStatus(id, "QUALIFIE", 7, Role.BENEVOLE);

        mvc.perform(post("/api/reports/{id}/accept", id).with(as(20, Role.INTERVENANT)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ATTRIBUE"))
            .andExpect(jsonPath("$.assigneeId").value(20));

        mvc.perform(post("/api/reports/{id}/accept", id).with(as(21, Role.INTERVENANT)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Mission deja attribuee"));
    }

    @Test
    void us23_nouveauNonAcceptable() throws Exception {
        double[] p = newArea();
        long id = createReport(1, "chien", p[0], p[1], 4);

        mvc.perform(post("/api/reports/{id}/accept", id).with(as(20, Role.INTERVENANT)))
            .andExpect(status().isConflict());
    }

    @Test
    void us23_benevoleNePeutPasAccepter() throws Exception {
        double[] p = newArea();
        long id = createReport(1, "chien", p[0], p[1], 4);
        setStatus(id, "QUALIFIE", 7, Role.BENEVOLE);

        mvc.perform(post("/api/reports/{id}/accept", id).with(as(7, Role.BENEVOLE)))
            .andExpect(status().isForbidden());
    }

    @Test
    void rm04_deuxAcceptationsSimultaneesUneSeuleGagne() throws Exception {
        double[] p = newArea();
        long id = createReport(1, "chien", p[0], p[1], 5);
        setStatus(id, "QUALIFIE", 7, Role.BENEVOLE);

        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        List<Callable<Boolean>> tasks = new ArrayList<>();
        for (long intervenant : new long[] {30L, 31L}) {
            tasks.add(() -> {
                start.await();
                try {
                    acceptMissionService.accept(id, new CurrentUser(intervenant, EnumSet.of(Role.INTERVENANT)));
                    return true;
                } catch (MissionAlreadyAssignedException e) {
                    return false;
                }
            });
        }
        List<Future<Boolean>> futures = new ArrayList<>();
        for (Callable<Boolean> task : tasks) {
            futures.add(pool.submit(task));
        }
        start.countDown();

        int success = 0;
        for (Future<Boolean> f : futures) {
            if (f.get()) {
                success++;
            }
        }
        pool.shutdown();
        assertThat(success).isEqualTo(1);
    }

    // ------------------------------------------------------------------ US24 + RM03

    @Test
    void us24_cheminCompletEtHistorique() throws Exception {
        double[] p = newArea();
        long id = createReport(1, "chien", p[0], p[1], 4);
        setStatus(id, "QUALIFIE", 7, Role.BENEVOLE);
        mvc.perform(post("/api/reports/{id}/accept", id).with(as(20, Role.INTERVENANT))).andExpect(status().isOk());
        setStatus(id, "EN_COURS", 20, Role.INTERVENANT);
        setStatus(id, "TERMINE", 20, Role.INTERVENANT);

        mvc.perform(get("/api/reports/{id}/history", id).with(as(1, Role.CITOYEN)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(5)))
            .andExpect(jsonPath("$[*].toStatus", hasItem("TERMINE")));
    }

    @Test
    void us24_transitionInvalide409EtEtatInchange() throws Exception {
        double[] p = newArea();
        long id = createReport(1, "chien", p[0], p[1], 4);

        mvc.perform(patch("/api/reports/{id}/status", id)
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"TERMINE\"}")
                .with(as(99, Role.ADMIN)))
            .andExpect(status().isConflict());

        mvc.perform(get("/api/reports/{id}", id).with(as(1, Role.CITOYEN)))
            .andExpect(jsonPath("$.status").value("NOUVEAU"));
    }

    @Test
    void us24_historiqueSelonLesDroits() throws Exception {
        double[] p = newArea();
        long id = createReport(1, "chien", p[0], p[1], 4);

        mvc.perform(get("/api/reports/{id}/history", id).with(as(2, Role.CITOYEN)))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/reports/{id}", id).with(as(2, Role.CITOYEN)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("NOUVEAU"))
            .andExpect(jsonPath("$.history").doesNotExist());
    }

    @Test
    void us24_seulLIntervenantAttribueFaitAvancer() throws Exception {
        double[] p = newArea();
        long id = createReport(1, "chien", p[0], p[1], 4);
        setStatus(id, "QUALIFIE", 7, Role.BENEVOLE);
        mvc.perform(post("/api/reports/{id}/accept", id).with(as(20, Role.INTERVENANT))).andExpect(status().isOk());

        mvc.perform(patch("/api/reports/{id}/status", id)
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"EN_COURS\"}")
                .with(as(21, Role.INTERVENANT)))
            .andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------------ Mes signalements

    @Test
    void mesSignalements_seulementLesMiensEtSansMasques() throws Exception {
        double[] p = newArea();
        long userId = 5000L + AREA.get();
        long mine = createReport(userId, "chien", p[0], p[1], 2);
        long hidden = createReport(userId, "chat", p[0], p[1], 2);
        createReport(userId + 1, "lapin", p[0], p[1], 2);

        mvc.perform(patch("/api/admin/reports/{id}/hide", hidden)
                .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"abus\"}")
                .with(as(99, Role.ADMIN)))
            .andExpect(status().isOk());

        mvc.perform(get("/api/reports/mine").with(as(userId, Role.CITOYEN)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].id").value(mine));
    }

    // ------------------------------------------------------------------ US25 + RM15

    @Test
    void us25_masquageMotiveEtAudite() throws Exception {
        double[] p = newArea();
        long id = createReport(1, "chien", p[0], p[1], 2);
        long auditsBefore = auditLogRepository.count();

        mvc.perform(patch("/api/admin/reports/{id}/hide", id)
                .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Photo sans animal\"}")
                .with(as(99, Role.ADMIN)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("MASQUE"));

        assertThat(auditLogRepository.count()).isEqualTo(auditsBefore + 1);
        assertThat(auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtAsc("REPORT", id))
            .anySatisfy(a -> {
                assertThat(a.getAction()).isEqualTo("REPORT_HIDDEN");
                assertThat(a.getActorId()).isEqualTo(99L);
                assertThat(a.getDetails()).isEqualTo("Photo sans animal");
            });

        // Un signalement masque n'existe plus pour les autres utilisateurs
        mvc.perform(get("/api/reports/{id}", id).with(as(1, Role.CITOYEN)))
            .andExpect(status().isNotFound());
    }

    @Test
    void us25_photoMasqueeInaccessibleSaufAdmin() throws Exception {
        double[] p = newArea();
        long id = createReport(1, "chien", p[0], p[1], 2);
        String json = mvc.perform(get("/api/reports/{id}", id).with(as(1, Role.CITOYEN)))
            .andReturn().getResponse().getContentAsString();
        String photoUrl = JsonPath.read(json, "$.photoUrl");

        mvc.perform(get(photoUrl)).andExpect(status().isOk());

        mvc.perform(patch("/api/admin/reports/{id}/hide", id)
                .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Photo abusive\"}")
                .with(as(99, Role.ADMIN)))
            .andExpect(status().isOk());

        mvc.perform(get(photoUrl)).andExpect(status().isNotFound());
        mvc.perform(get(photoUrl).with(as(1, Role.CITOYEN))).andExpect(status().isNotFound());
        mvc.perform(get(photoUrl).with(as(99, Role.ADMIN))).andExpect(status().isOk());
    }

    @Test
    void us25_photoInconnueOuUrlVarianteRefusee() throws Exception {
        double[] p = newArea();
        long id = createReport(1, "chien", p[0], p[1], 2);
        String json = mvc.perform(get("/api/reports/{id}", id).with(as(1, Role.CITOYEN)))
            .andReturn().getResponse().getContentAsString();
        String photoUrl = JsonPath.read(json, "$.photoUrl");

        mvc.perform(get("/photos/inconnue.png")).andExpect(status().isNotFound());
        mvc.perform(get("/photos/" + photoUrl.substring("/photos/".length()).toUpperCase()))
            .andExpect(status().isNotFound());
    }

    @Test
    void us25_motifObligatoire() throws Exception {
        double[] p = newArea();
        long id = createReport(1, "chien", p[0], p[1], 2);

        mvc.perform(patch("/api/admin/reports/{id}/hide", id)
                .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\" \"}")
                .with(as(99, Role.ADMIN)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void us25_impossibleApresAttribution() throws Exception {
        double[] p = newArea();
        long id = createReport(1, "chien", p[0], p[1], 4);
        setStatus(id, "QUALIFIE", 7, Role.BENEVOLE);
        mvc.perform(post("/api/reports/{id}/accept", id).with(as(20, Role.INTERVENANT))).andExpect(status().isOk());

        mvc.perform(patch("/api/admin/reports/{id}/hide", id)
                .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"abus\"}")
                .with(as(99, Role.ADMIN)))
            .andExpect(status().isConflict());
    }

    @Test
    void us25_reserveALAdmin() throws Exception {
        double[] p = newArea();
        long id = createReport(1, "chien", p[0], p[1], 2);

        mvc.perform(patch("/api/admin/reports/{id}/hide", id)
                .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"abus\"}")
                .with(as(7, Role.BENEVOLE)))
            .andExpect(status().isForbidden());
    }
}
