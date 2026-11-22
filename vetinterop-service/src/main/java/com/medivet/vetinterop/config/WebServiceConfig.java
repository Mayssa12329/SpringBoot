package com.medivet.vetinterop.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.ws.config.annotation.WsConfigurerAdapter;
import org.springframework.ws.server.EndpointInterceptor;
import org.springframework.ws.soap.server.endpoint.interceptor.PayloadValidatingInterceptor;
import org.springframework.ws.wsdl.wsdl11.DefaultWsdl11Definition;
import org.springframework.xml.xsd.SimpleXsdSchema;
import org.springframework.xml.xsd.XsdSchema;

import java.util.List;

/**
 * Serveur SOAP contract-first : le XSD est la source de vérité.
 * - WSDL généré à partir du XSD : GET /ws/vetinterop.wsdl
 * - toute requête hors XSD (ex. puce de 3 chiffres) est rejetée par un SOAP Fault "Client" (RM10).
 */
@Configuration
public class WebServiceConfig extends WsConfigurerAdapter {

    @Bean
    public XsdSchema vetInteropSchema() {
        return new SimpleXsdSchema(new ClassPathResource("xsd/vetinterop.xsd"));
    }

    // Le nom du bean ("vetinterop") donne le nom du fichier WSDL : /ws/vetinterop.wsdl
    @Bean(name = "vetinterop")
    public DefaultWsdl11Definition vetInteropWsdl(XsdSchema vetInteropSchema) {
        DefaultWsdl11Definition wsdl = new DefaultWsdl11Definition();
        wsdl.setPortTypeName("VetInteropPort");
        wsdl.setLocationUri("/ws");
        wsdl.setTargetNamespace("http://medivet.tn/vetinterop");
        wsdl.setSchema(vetInteropSchema);
        return wsdl;
    }

    @Bean
    public PayloadValidatingInterceptor payloadValidatingInterceptor(XsdSchema vetInteropSchema) {
        PayloadValidatingInterceptor interceptor = new PayloadValidatingInterceptor();
        interceptor.setXsdSchema(vetInteropSchema);
        interceptor.setValidateRequest(true);
        interceptor.setValidateResponse(false);
        return interceptor;
    }

    @Override
    public void addInterceptors(List<EndpointInterceptor> interceptors) {
        interceptors.add(payloadValidatingInterceptor(vetInteropSchema()));
    }
}
