package com.medivet.vetpharma.exception;

public class StockIndisponibleException extends RuntimeException {
    public StockIndisponibleException(String message) {
        super(message);
    }
}
