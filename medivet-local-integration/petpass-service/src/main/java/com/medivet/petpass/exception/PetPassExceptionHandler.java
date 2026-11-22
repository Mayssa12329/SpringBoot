package com.medivet.petpass.exception;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Gestionnaire d'exceptions centralisé pour le microservice PetPass.
 * Capture et standardise les erreurs HTTP (400, 404, 409, 500).
 */
@RestControllerAdvice(basePackages = "com.medivet.petpass.controller")
public class PetPassExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(PetPassExceptionHandler.class);

    // ── 404 - Ressource non trouvée ──────────────────────────────────────────
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            ResourceNotFoundException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request.getRequestURI(), null);
    }

    // ── 409 - Doublon / Conflit ──────────────────────────────────────────────
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicate(
            DuplicateResourceException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage(), request.getRequestURI(), null);
    }

    // ── 400 - Validation Bean Validation (@Valid) ───────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fe.getField(), fe.getDefaultMessage());
        }
        return buildResponse(HttpStatus.BAD_REQUEST, "Validation des données échouée", request.getRequestURI(), fieldErrors);
    }

    // ── 500 - Erreur inattendue ──────────────────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(
            Exception ex, HttpServletRequest request) {
        log.error("Erreur inattendue à l'URI {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                "Une erreur interne inattendue s'est produite.", request.getRequestURI(), null);
    }

    // ── Méthode utilitaire ───────────────────────────────────────────────────
    private ResponseEntity<ErrorResponse> buildResponse(
            HttpStatus status, String message, String path, Map<String, String> errors) {
        ErrorResponse body = new ErrorResponse(
                status.value(),
                status.getReasonPhrase(),
                message,
                path,
                LocalDateTime.now(),
                errors
        );
        return ResponseEntity.status(status).body(body);
    }

    // ── DTO de réponse d'erreur ──────────────────────────────────────────────
    @Schema(description = "Enveloppe standard des erreurs HTTP PetPass")
    public record ErrorResponse(
            int status,
            String error,
            String message,
            String path,
            LocalDateTime timestamp,
            Map<String, String> details
    ) {}
}
