package com.medivet.vetpharma.exception;

import io.grpc.Status;

/**
 * Traduit les exceptions métier en status gRPC.
 * Utilisé dans {@link com.medivet.vetpharma.grpc.VetPharmaGrpcService}.
 *
 * <pre>
 * ResourceNotFoundException      → NOT_FOUND
 * StockIndisponibleException     → FAILED_PRECONDITION
 * ReservationExpireeException    → FAILED_PRECONDITION
 * IllegalStateException          → FAILED_PRECONDITION  (ex. confirmer une réservation annulée)
 * IllegalArgumentException       → INVALID_ARGUMENT     (ex. quantité négative)
 * Exception (catch-all)          → INTERNAL
 * </pre>
 */
public final class GlobalExceptionHandler {

    private GlobalExceptionHandler() {}

    public static Status toGrpcStatus(Exception ex) {
        return switch (ex) {
            case ResourceNotFoundException e ->
                    Status.NOT_FOUND.withDescription(e.getMessage());
            case StockIndisponibleException e ->
                    Status.FAILED_PRECONDITION.withDescription(e.getMessage());
            case ReservationExpireeException e ->
                    Status.FAILED_PRECONDITION.withDescription(e.getMessage());
            case IllegalStateException e ->
                    Status.FAILED_PRECONDITION.withDescription(e.getMessage());
            case IllegalArgumentException e ->
                    Status.INVALID_ARGUMENT.withDescription(e.getMessage());
            default ->
                    Status.INTERNAL.withDescription("Erreur interne : " + ex.getMessage());
        };
    }
}
