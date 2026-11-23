package com.medivet.adoptanimal.client;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.headerDoesNotExist;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/** Vérifie le contrat réel de PetPass : GET /api/v1/animals/{id} (champs en plus ignorés). */
class PetPassRestClientTest {

    private final RestClient.Builder builder = RestClient.builder().baseUrl("http://petpass");
    private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
    private final PetPassRestClient client = new PetPassRestClient(builder.build());

    @Test
    void ficheValideDonneEligible() {
        server.expect(requestTo("http://petpass/api/v1/animals/7")).andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("""
                        {"id":7,"ownerId":3,"name":"Rex","species":"CHIEN","microchipId":"250268500123456",
                         "vaccinationStatus":"up_to_date","healthStatus":"healthy","champInconnu":true}
                        """, MediaType.APPLICATION_JSON));
        assertThat(client.verifier(7L).eligible()).isTrue();
        server.verify();
    }

    @Test
    void vaccinationExpireeDonneNonEligible() {
        server.expect(requestTo("http://petpass/api/v1/animals/8"))
                .andRespond(withSuccess("{\"id\":8,\"vaccinationStatus\":\"EXPIRED\",\"healthStatus\":\"BON\"}",
                        MediaType.APPLICATION_JSON));
        var r = client.verifier(8L);
        assertThat(r.statut()).isEqualTo("NOT_ELIGIBLE");
        assertThat(r.motifs()).isNotEmpty();
    }

    @Test
    void animalInconnuDonneNonEligible() {
        server.expect(requestTo("http://petpass/api/v1/animals/999")).andRespond(withStatus(HttpStatus.NOT_FOUND));
        assertThat(client.verifier(999L).statut()).isEqualTo("NOT_ELIGIBLE");
    }

    @AfterEach
    void nettoyerContexte() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void jetonDeLaRequeteEntranteEstTransmisAPetPass() {
        MockHttpServletRequest requete = new MockHttpServletRequest();
        requete.addHeader(HttpHeaders.AUTHORIZATION, "Bearer abc.def.ghi");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(requete));
        server.expect(requestTo("http://petpass/api/v1/animals/7"))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer abc.def.ghi"))
                .andRespond(withSuccess("{\"id\":7,\"vaccinationStatus\":\"up_to_date\",\"healthStatus\":\"healthy\"}",
                        MediaType.APPLICATION_JSON));
        assertThat(client.verifier(7L).eligible()).isTrue();
        server.verify();
    }

    @Test
    void sansRequeteEntranteAucunJetonNEstEnvoye() {
        server.expect(requestTo("http://petpass/api/v1/animals/7"))
                .andExpect(headerDoesNotExist(HttpHeaders.AUTHORIZATION))
                .andRespond(withSuccess("{\"id\":7,\"vaccinationStatus\":\"up_to_date\",\"healthStatus\":\"healthy\"}",
                        MediaType.APPLICATION_JSON));
        assertThat(client.verifier(7L).eligible()).isTrue();
    }

    @Test
    void refusJwtDonneIndisponibleEtNonNonEligible() {
        server.expect(requestTo("http://petpass/api/v1/animals/7")).andRespond(withStatus(HttpStatus.UNAUTHORIZED));
        assertThat(client.verifier(7L).indisponible()).isTrue();
    }
}
