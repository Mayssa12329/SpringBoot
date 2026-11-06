package tn.medivet.adoptanimal.dto;

import java.time.Instant;
import java.util.List;

/** Format unique de toutes les erreurs renvoyées par l'API. */
public record ApiError(Instant timestamp, int status, String error, String message,
                       List<String> details, String path) {
}
