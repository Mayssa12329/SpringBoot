package com.medivet.helpanimal.config;

import com.medivet.helpanimal.service.StorageService;
import com.medivet.helpanimal.web.PhotoAccessInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Sert les photos stockees sur disque sous l'URL /photos/**, avec controle d'acces (US25). */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final String PHOTOS_PATTERN = "/photos/**";

    private final StorageService storageService;
    private final PhotoAccessInterceptor photoAccessInterceptor;

    public WebConfig(StorageService storageService, PhotoAccessInterceptor photoAccessInterceptor) {
        this.storageService = storageService;
        this.photoAccessInterceptor = photoAccessInterceptor;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = storageService.getRoot().toUri().toString();
        if (!location.endsWith("/")) {
            location = location + "/";
        }
        // no-cache : le navigateur revalide (304), donc une photo masquee cesse d'etre affichee
        registry.addResourceHandler(PHOTOS_PATTERN)
            .addResourceLocations(location)
            .setCacheControl(CacheControl.noCache());
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(photoAccessInterceptor).addPathPatterns(PHOTOS_PATTERN);
    }
}
