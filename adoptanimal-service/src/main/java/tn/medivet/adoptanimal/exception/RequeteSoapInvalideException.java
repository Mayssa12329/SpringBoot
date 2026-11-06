package tn.medivet.adoptanimal.exception;

/** SOAP Fault de type client (requête hors contrat) : inutile de réessayer. */
public class RequeteSoapInvalideException extends RuntimeException {
    public RequeteSoapInvalideException(String message) {
        super(message);
    }
}
