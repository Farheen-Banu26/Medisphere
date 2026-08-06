package com.infosys.fhir_service.dto;

import java.time.LocalDateTime;
import java.util.List;

public class SyncResponseDTO {
    private String patientId;
    private String status;
    private LocalDateTime syncedAt;
    private List<String> resources;

    public SyncResponseDTO() {
    }

    public SyncResponseDTO(String patientId, String status, LocalDateTime syncedAt, List<String> resources) {
        this.patientId = patientId;
        this.status = status;
        this.syncedAt = syncedAt;
        this.resources = resources;
    }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getSyncedAt() { return syncedAt; }
    public void setSyncedAt(LocalDateTime syncedAt) { this.syncedAt = syncedAt; }
    public List<String> getResources() { return resources; }
    public void setResources(List<String> resources) { this.resources = resources; }
}
