package com.medivet.helpanimal.exception;

import org.springframework.http.HttpStatus;

/** 400 : photo absente, illisible ou d'un format refuse (US19). */
public class InvalidPhotoException extends ApiException {

    public InvalidPhotoException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
