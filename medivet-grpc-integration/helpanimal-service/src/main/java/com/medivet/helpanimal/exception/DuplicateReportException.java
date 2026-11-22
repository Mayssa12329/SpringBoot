package com.medivet.helpanimal.exception;

import java.util.Map;

import org.springframework.http.HttpStatus;

/** 409 : un signalement actif de meme espece existe deja a proximite (RM02). */
public class DuplicateReportException extends ApiException {

    private final Long existingReportId;

    public DuplicateReportException(Long existingReportId) {
        super(HttpStatus.CONFLICT,
            "Un signalement actif de la meme espece existe deja a proximite",
            Map.of("existingReportId", existingReportId));
        this.existingReportId = existingReportId;
    }

    public Long getExistingReportId() {
        return existingReportId;
    }
}
