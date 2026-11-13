package com.medivet.helpanimal.web;

import java.io.IOException;

import com.medivet.helpanimal.domain.ReportStatus;
import com.medivet.helpanimal.repository.ReportRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * US25 : une photo n'est servie que si un signalement la reference et n'est pas masque.
 * L'administrateur garde l'acces aux photos masquees pour la verification.
 * Refus par defaut : une URL qui ne correspond pas exactement a une photo connue donne 404.
 */
@Component
public class PhotoAccessInterceptor implements HandlerInterceptor {

    private final ReportRepository reportRepository;

    public PhotoAccessInterceptor(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {
        String photoUrl = request.getRequestURI().substring(request.getContextPath().length());
        boolean allowed = reportRepository.findStatusByPhotoUrl(photoUrl)
            .filter(status -> status != ReportStatus.MASQUE || request.isUserInRole("ADMIN"))
            .isPresent();
        if (!allowed) {
            response.sendError(HttpStatus.NOT_FOUND.value());
        }
        return allowed;
    }
}
