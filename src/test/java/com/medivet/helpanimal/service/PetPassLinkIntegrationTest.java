package com.medivet.helpanimal.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.ServerSocket;
import java.util.EnumSet;

import javax.imageio.ImageIO;

import com.medivet.helpanimal.domain.ReportCategory;
import com.medivet.helpanimal.domain.ReportStatus;
import com.medivet.helpanimal.repository.ReportRepository;
import com.medivet.helpanimal.security.CurrentUser;
import com.medivet.helpanimal.security.Role;
import com.medivet.helpanimal.web.dto.ReportCreateRequest;
import com.medivet.helpanimal.web.dto.StatusChangeRequest;
import com.medivet.petpass.model.Animal;
import com.medivet.petpass.repository.AnimalRepository;
import com.medivet.petpass.repository.MedicalRecordRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/**
 * Lien HelpAnimal -> PetPass par un vrai appel REST sur le serveur HTTP demarre :
 * a la fin d'un sauvetage, l'animal et son acte medical apparaissent dans PetPass.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@ActiveProfiles("test")
class PetPassLinkIntegrationTest {

    private static final int PORT = freePort();
    private static final CurrentUser CITOYEN = new CurrentUser(501L, EnumSet.of(Role.UTILISATEUR));
    private static final CurrentUser INTERVENANT = new CurrentUser(502L, EnumSet.of(Role.VETERINAIRE));

    @DynamicPropertySource
    static void petPassOnThisServer(DynamicPropertyRegistry registry) {
        registry.add("server.port", () -> PORT);
        registry.add("petpass.enabled", () -> "true");
        registry.add("petpass.base-url", () -> "http://localhost:" + PORT);
        // Ce test verifie le lien PetPass, pas le delai gRPC (RM13, teste dans RescueCoordinationClientTest) :
        // sur une JVM froide, le tout premier appel gRPC peut depasser 3 s.
        registry.add("rescue.grpc.timeout-ms", () -> "20000");
    }

    @Autowired
    private ReportService reportService;

    @Autowired
    private AcceptMissionService acceptMissionService;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private AnimalRepository animalRepository;

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    @Test
    void sauvetageTermineEnregistreLAnimalDansPetPass() throws Exception {
        long id = reportService.create(request(), photo(), CITOYEN).id();
        reportService.changeStatus(id, new StatusChangeRequest(ReportStatus.QUALIFIE, "verifie"), INTERVENANT);
        acceptMissionService.accept(id, INTERVENANT);
        reportService.changeStatus(id, new StatusChangeRequest(ReportStatus.EN_COURS, null), INTERVENANT);
        reportService.changeStatus(id, new StatusChangeRequest(ReportStatus.TERMINE, null), INTERVENANT);

        Long animalId = waitForPetPassLink(id);
        assertThat(animalId).as("lien PetPass enregistre sur le signalement").isNotNull();

        Animal animal = animalRepository.findById(animalId).orElseThrow();
        assertThat(animal.getOwnerId()).isEqualTo(INTERVENANT.id());
        assertThat(animal.getSpecies()).isEqualTo("renard");
        assertThat(animal.getName()).isEqualTo("Animal secouru #" + id);
        assertThat(medicalRecordRepository.findByAnimalIdOrderByConsultationDateDesc(animalId))
            .singleElement()
            .satisfies(record -> assertThat(record.getDiagnosis()).startsWith("Sauvetage HelpAnimal"));
    }

    /** L'appel PetPass est asynchrone, apres la validation de la transaction. */
    private Long waitForPetPassLink(long reportId) throws InterruptedException {
        for (int i = 0; i < 50; i++) {
            Long animalId = reportRepository.findById(reportId).orElseThrow().getPetpassAnimalId();
            if (animalId != null) {
                return animalId;
            }
            Thread.sleep(100);
        }
        return null;
    }

    private static ReportCreateRequest request() {
        ReportCreateRequest request = new ReportCreateRequest();
        request.setSpecies("renard");
        request.setCategory(ReportCategory.BLESSE);
        request.setDescription("Renard blesse au bord de la route");
        request.setSeverity(4);
        request.setLatitude(-12.3456);
        request.setLongitude(45.6789);
        return request;
    }

    private static MockMultipartFile photo() throws IOException {
        BufferedImage image = new BufferedImage(20, 20, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return new MockMultipartFile("photo", "renard.png", "image/png", out.toByteArray());
    }

    private static int freePort() {
        try (ServerSocket socket = new ServerSocket(0)) {
            return socket.getLocalPort();
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }
}
