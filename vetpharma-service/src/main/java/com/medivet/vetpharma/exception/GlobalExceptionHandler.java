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
        if (ex instanceof ResourceNotFoundException e) {
            return Status.NOT_FOUND.withDescription(e.getMessage());
        }
        if (ex instanceof StockIndisponibleException e) {
            return Status.FAILED_PRECONDITION.withDescription(e.getMessage());
        }
        if (ex instanceof ReservationExpireeException e) {
            return Status.FAILED_PRECONDITION.withDescription(e.getMessage());
        }
        if (ex instanceof IllegalStateException e) {
            return Status.FAILED_PRECONDITION.withDescription(e.getMessage());
        }
        if (ex instanceof IllegalArgumentException e) {
            return Status.INVALID_ARGUMENT.withDescription(e.getMessage());
        }
        return Status.INTERNAL.withDescription("Erreur interne : " + ex.getMessage());
    }
}
