package com.medivet.helpanimal.web.dto;

import java.time.Instant;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Format commun des erreurs renvoyees par l'API. */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApiError(
    Instant timestamp,
    int status,
    String error,
    String message,
    String path,
    Map<String, Object> details) {
}
