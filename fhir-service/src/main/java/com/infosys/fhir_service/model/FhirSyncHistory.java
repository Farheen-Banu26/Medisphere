package com.infosys.fhir_service.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "fhir_sync_history")
public class FhirSyncHistory {

    @Id
    private String id;
    private String patientId;
    private String resourceType;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String message;

    public FhirSyncHistory() {
    }

    public FhirSyncHistory(String patientId, String resourceType, String status,
            LocalDateTime startedAt, LocalDateTime completedAt, String message) {
        this.patientId = patientId;
        this.resourceType = resourceType;
        this.status = status;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
        this.message = message;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
