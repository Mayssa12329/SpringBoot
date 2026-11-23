package com.medivet.helpanimal.exception;

import org.springframework.http.HttpStatus;

/** 413 : photo trop lourde (US19). */
public class PhotoTooLargeException extends ApiException {

    public PhotoTooLargeException(String message) {
        super(HttpStatus.PAYLOAD_TOO_LARGE, message);
    }
}
