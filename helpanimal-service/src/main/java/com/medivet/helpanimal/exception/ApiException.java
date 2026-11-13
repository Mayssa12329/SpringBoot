package com.medivet.helpanimal.exception;

import java.util.Map;

import org.springframework.http.HttpStatus;

/** Exception metier traduite en reponse HTTP par GlobalExceptionHandler. */
public abstract class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final transient Map<String, Object> details;

    protected ApiException(HttpStatus status, String message) {
        this(status, message, Map.of());
    }

    protected ApiException(HttpStatus status, String message, Map<String, Object> details) {
        super(message);
        this.status = status;
        this.details = details;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public Map<String, Object> getDetails() {
        return details;
    }
}
