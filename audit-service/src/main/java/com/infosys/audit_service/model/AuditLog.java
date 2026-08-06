package com.infosys.audit_service.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "audit_logs")
public class AuditLog {

    @Id
    private String id;
    private String action;
    private String user;
    private String role;
    private String patientId;
    private String status;
    private String details;
    private LocalDateTime timestamp;

    public AuditLog() {
    }

    public AuditLog(String action, String user, String role, String patientId, String status, String details) {
        this.action = action;
        this.user = user;
        this.role = role;
        this.patientId = patientId;
        this.status = status;
        this.details = details;
        this.timestamp = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getUser() { return user; }
    public void setUser(String user) { this.user = user; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
