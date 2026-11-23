package com.medivet;

import com.medivet.helpanimal.security.JwtUtil;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class HelpAnimalServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(HelpAnimalServiceApplication.class, args);
    }

    @Bean
    public RestTemplate restTemplate(JwtUtil jwtUtil) {
        RestTemplate template = new RestTemplate();
        template.getInterceptors().add((request, body, execution) -> {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null && attrs.getRequest() != null) {
                String authHeader = attrs.getRequest().getHeader("Authorization");
                if (authHeader != null && !authHeader.isEmpty()) {
                    request.getHeaders().set("Authorization", authHeader);
                    return execution.execute(request, body);
                }
            }
            // Fallback token systeme pour les appels en arriere-plan
            String sysToken = jwtUtil.genererToken("system-helpanimal@medivet.com");
            request.getHeaders().set("Authorization", "Bearer " + sysToken);
            return execution.execute(request, body);
        });
        return template;
    }
}
