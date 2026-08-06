package com.medisphere.alert_service.exception;

public class InvalidLifecycleTransitionException extends RuntimeException {

    public InvalidLifecycleTransitionException(String message) {
        super(message);
    }
}
