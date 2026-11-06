package tn.medivet.adoptanimal.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import tn.medivet.adoptanimal.dto.ApiError;

import java.time.Instant;
import java.util.List;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RessourceIntrouvableException.class)
    public ResponseEntity<ApiError> introuvable(RessourceIntrouvableException ex, HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), List.of(), req);
    }

    @ExceptionHandler(ConflitMetierException.class)
    public ResponseEntity<ApiError> conflit(ConflitMetierException ex, HttpServletRequest req) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), List.of(), req);
    }

    @ExceptionHandler({ObjectOptimisticLockingFailureException.class, DataIntegrityViolationException.class})
    public ResponseEntity<ApiError> concurrence(Exception ex, HttpServletRequest req) {
        log.warn("Conflit de concurrence : {}", ex.getClass().getSimpleName());
        return build(HttpStatus.CONFLICT,
                "Opération en conflit avec une autre modification (déjà finalisée ou doublon)", List.of(), req);
    }

    @ExceptionHandler(RegleMetierException.class)
    public ResponseEntity<ApiError> regle(RegleMetierException ex, HttpServletRequest req) {
        return build(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), ex.getMotifs(), req);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<String> details = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + " : " + fe.getDefaultMessage())
                .toList();
        return build(HttpStatus.BAD_REQUEST, "Données invalides", details, req);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiError> requeteIllisible(Exception ex, HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, "Requête illisible ou paramètre de type incorrect", List.of(), req);
    }

    @ExceptionHandler(RequeteSoapInvalideException.class)
    public ResponseEntity<ApiError> soapInvalide(RequeteSoapInvalideException ex, HttpServletRequest req) {
        return build(HttpStatus.BAD_GATEWAY, "Le registre VetInterop a rejeté la requête : " + ex.getMessage(),
                List.of(), req);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> autre(Exception ex, HttpServletRequest req) {
        // Erreurs standard de Spring MVC (404 de ressource, 405, 415...) : on garde leur statut.
        if (ex instanceof org.springframework.web.ErrorResponse er) {
            HttpStatus status = HttpStatus.valueOf(er.getStatusCode().value());
            return build(status, status.getReasonPhrase(), List.of(), req);
        }
        log.error("Erreur inattendue", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur interne", List.of(), req);
    }

    private ResponseEntity<ApiError> build(HttpStatus status, String message, List<String> details,
                                           HttpServletRequest req) {
        ApiError body = new ApiError(Instant.now(), status.value(), status.getReasonPhrase(), message,
                details, req.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }
}
