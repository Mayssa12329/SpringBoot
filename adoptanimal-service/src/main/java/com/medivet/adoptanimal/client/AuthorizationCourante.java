package com.medivet.adoptanimal.client;

import org.springframework.http.HttpHeaders;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Récupère l'en-tête "Authorization: Bearer ..." de la requête HTTP en cours, pour le transmettre à PetPass
 * (PetPass exige un JWT émis par auth-service sur tout /api/v1/**). Hors requête HTTP : null.
 */
final class AuthorizationCourante {

    private AuthorizationCourante() {
    }

    static String valeur() {
        RequestAttributes attributs = RequestContextHolder.getRequestAttributes();
        if (attributs instanceof ServletRequestAttributes servlet) {
            return servlet.getRequest().getHeader(HttpHeaders.AUTHORIZATION);
        }
        return null;
    }
}
