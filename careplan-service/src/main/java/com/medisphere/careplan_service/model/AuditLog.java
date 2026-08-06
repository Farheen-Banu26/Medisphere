package com.medisphere.careplan_service.model;

import java.time.LocalDateTime;

/**
 * Embedded document representing an audit trail record for a CarePlan.
 */
public class AuditLog {

    private String auditId;
    private String action;
    private String performedBy;
    private String performedRole;
    private String description;
    private LocalDateTime timestamp;

    public AuditLog() {
    }

    public AuditLog(String auditId, String action, String performedBy, String performedRole, String description, LocalDateTime timestamp) {
        this.auditId = auditId;
        this.action = action;
        this.performedBy = performedBy;
        this.performedRole = performedRole;
        this.description = description;
        this.timestamp = timestamp;
    }

    public String getAuditId() {
        return auditId;
    }

    public void setAuditId(String auditId) {
        this.auditId = auditId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(String performedBy) {
        this.performedBy = performedBy;
    }

    public String getPerformedRole() {
        return performedRole;
    }

    public void setPerformedRole(String performedRole) {
        this.performedRole = performedRole;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
