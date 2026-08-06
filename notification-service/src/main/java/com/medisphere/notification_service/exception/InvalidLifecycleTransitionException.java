package com.medisphere.notification_service.exception;

public class InvalidLifecycleTransitionException extends RuntimeException {
    public InvalidLifecycleTransitionException(String message) {
        super(message);
    }
}
