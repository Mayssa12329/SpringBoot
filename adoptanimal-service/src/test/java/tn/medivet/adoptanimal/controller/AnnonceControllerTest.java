package tn.medivet.adoptanimal.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tn.medivet.adoptanimal.entity.Annonce;
import tn.medivet.adoptanimal.entity.StatutAnnonce;
import tn.medivet.adoptanimal.exception.RessourceIntrouvableException;
import tn.medivet.adoptanimal.service.AnnonceService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AnnonceController.class)
class AnnonceControllerTest {

    @Autowired MockMvc mvc;
    @MockitoBean AnnonceService annonceService;

    private static final String CORPS_VALIDE = """
            {"animalId":1,"puce":"250268500123456","nom":"Rex","espece":"CHIEN",
             "ageEstime":3,"localisation":"Tunis","refugeId":10}""";

    @Test
    void publier_puceInvalide_renvoie400AvecDetails() throws Exception {
        mvc.perform(post("/api/v1/annonces").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"animalId":1,"puce":"123","nom":"Rex","espece":"CHIEN","refugeId":10}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details").isNotEmpty());
    }

    @Test
    void publier_valide_renvoie201EtLocation() throws Exception {
        Annonce annonce = new Annonce();
        annonce.setId(7L);
        annonce.setStatut(StatutAnnonce.ACTIVE);
        when(annonceService.publier(any(), any())).thenReturn(annonce);

        mvc.perform(post("/api/v1/annonces").contentType(MediaType.APPLICATION_JSON).content(CORPS_VALIDE))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.statut").value("ACTIVE"));
    }

    @Test
    void trouver_inconnue_renvoie404() throws Exception {
        when(annonceService.trouver(99L)).thenThrow(new RessourceIntrouvableException("Annonce 99 introuvable"));

        mvc.perform(get("/api/v1/annonces/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
}
