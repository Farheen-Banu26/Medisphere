package com.medisphere.careplan_service.exception;

/**
 * Thrown when a care plan cannot be found by its ID.
 */
public class CarePlanNotFoundException extends RuntimeException {

    public CarePlanNotFoundException(String message) {
        super(message);
    }
}
