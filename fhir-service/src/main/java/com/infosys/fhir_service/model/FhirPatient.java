package com.infosys.fhir_service.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "fhir_resources")
public class FhirPatient {

    @Id
    private String id;

    private String patientId;
    private String fhirId;
    private String resourceType;
    private String resourceData;
    private LocalDateTime lastSynced;

    public FhirPatient() {
    }

    public FhirPatient(String id, String patientId, String fhirId, String resourceType,
            String resourceData, LocalDateTime lastSynced) {

        this.id = id;
        this.patientId = patientId;
        this.resourceType = resourceType;
        this.resourceData = resourceData;
        this.lastSynced = lastSynced;
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

    public String getFhirId() {
        return fhirId;
    }

    public void setFhirId(String fhirId) {
        this.fhirId = fhirId;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public String getResourceData() {
        return resourceData;
    }

    public void setResourceData(String resourceData) {
        this.resourceData = resourceData;
    }

    public LocalDateTime getLastSynced() {
        return lastSynced;
    }

    public void setLastSynced(LocalDateTime lastSynced) {
        this.lastSynced = lastSynced;
    }
}