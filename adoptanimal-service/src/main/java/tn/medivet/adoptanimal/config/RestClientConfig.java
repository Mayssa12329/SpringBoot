package tn.medivet.adoptanimal.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/** Clients REST sortants, avec timeouts explicites (RM13). */
@Configuration
public class RestClientConfig {

    @Bean
    public RestClient petPassRestClient(@Value("${petpass.url}") String url,
                                        @Value("${petpass.timeout-ms}") int timeoutMs) {
        return construire(url, timeoutMs);
    }

    @Bean
    public RestClient notificationRestClient(@Value("${notification.url}") String url,
                                             @Value("${notification.timeout-ms}") int timeoutMs) {
        return construire(url, timeoutMs);
    }

    private RestClient construire(String url, int timeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);
        return RestClient.builder().baseUrl(url).requestFactory(factory).build();
    }
}
