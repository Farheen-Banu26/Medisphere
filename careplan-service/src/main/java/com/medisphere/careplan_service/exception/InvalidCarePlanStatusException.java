package com.medisphere.careplan_service.exception;

/**
 * Thrown when an invalid status transition is attempted on a care plan,
 * e.g. trying to approve an already-rejected plan.
 */
public class InvalidCarePlanStatusException extends RuntimeException {

    public InvalidCarePlanStatusException(String message) {
        super(message);
    }
}
