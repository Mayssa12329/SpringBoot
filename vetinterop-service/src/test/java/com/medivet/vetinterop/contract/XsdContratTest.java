package com.medivet.vetinterop.contract;

import org.junit.jupiter.api.Test;
import org.xml.sax.SAXException;

import javax.xml.XMLConstants;
import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;
import java.io.StringReader;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Le XSD est le contrat : une puce hors format est refusée (elle deviendra un SOAP Fault Client sur le serveur). */
class XsdContratTest {

    private static final String NS = "http://medivet.tn/vetinterop";

    private Schema schema() throws SAXException {
        return SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI)
                .newSchema(getClass().getResource("/xsd/vetinterop.xsd"));
    }

    private String requete(String puce) {
        return "<VerifyAnimalIdentityRequest xmlns=\"" + NS + "\"><puce>" + puce + "</puce></VerifyAnimalIdentityRequest>";
    }

    @Test
    void puceDeQuinzeChiffresEstValide() {
        assertThatCode(() -> schema().newValidator()
                .validate(new StreamSource(new StringReader(requete("250268500123456")))))
                .doesNotThrowAnyException();
    }

    @Test
    void puceTropCourteEstRefusee() {
        assertThatThrownBy(() -> schema().newValidator()
                .validate(new StreamSource(new StringReader(requete("123")))))
                .isInstanceOf(SAXException.class);
    }

    @Test
    void puceAvecDesLettresEstRefusee() {
        assertThatThrownBy(() -> schema().newValidator()
                .validate(new StreamSource(new StringReader(requete("25026850012345A")))))
                .isInstanceOf(SAXException.class);
    }
}
