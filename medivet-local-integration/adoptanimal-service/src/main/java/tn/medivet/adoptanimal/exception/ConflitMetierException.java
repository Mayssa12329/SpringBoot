package tn.medivet.adoptanimal.exception;

/** Conflit d'état ou de concurrence : HTTP 409. */
public class ConflitMetierException extends RuntimeException {
    public ConflitMetierException(String message) {
        super(message);
    }
}
