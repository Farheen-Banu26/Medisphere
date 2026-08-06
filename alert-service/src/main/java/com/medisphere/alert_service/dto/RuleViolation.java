package com.medisphere.alert_service.dto;

import com.medisphere.alert_service.model.AlertSeverity;

public class RuleViolation {

    private String type;
    private AlertSeverity severity;
    private String message;

    public RuleViolation() {
    }

    public RuleViolation(String type, AlertSeverity severity, String message) {
        this.type = type;
        this.severity = severity;
        this.message = message;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public AlertSeverity getSeverity() {
        return severity;
    }

    public void setSeverity(AlertSeverity severity) {
        this.severity = severity;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
