package tn.medivet.adoptanimal.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.oxm.jaxb.Jaxb2Marshaller;
import org.springframework.ws.client.core.WebServiceTemplate;
import org.springframework.ws.transport.http.HttpUrlConnectionMessageSender;

import java.time.Duration;

/** Client SOAP vers VetInterop : classes JAXB générées depuis le XSD, timeouts explicites. */
@Configuration
@Profile("!stub")
public class SoapClientConfig {

    @Bean
    public Jaxb2Marshaller vetInteropMarshaller() {
        Jaxb2Marshaller marshaller = new Jaxb2Marshaller();
        marshaller.setContextPath("tn.medivet.adoptanimal.client.soap.generated");
        return marshaller;
    }

    @Bean
    public WebServiceTemplate vetInteropWebServiceTemplate(Jaxb2Marshaller vetInteropMarshaller,
                                                           @Value("${vetinterop.url}") String url,
                                                           @Value("${vetinterop.timeout-ms}") int timeoutMs) {
        HttpUrlConnectionMessageSender sender = new HttpUrlConnectionMessageSender();
        sender.setConnectionTimeout(Duration.ofMillis(timeoutMs));
        sender.setReadTimeout(Duration.ofMillis(timeoutMs));

        WebServiceTemplate template = new WebServiceTemplate();
        template.setMarshaller(vetInteropMarshaller);
        template.setUnmarshaller(vetInteropMarshaller);
        template.setDefaultUri(url);
        template.setMessageSender(sender);
        return template;
    }
}
