package com.infosys.consent_service.model;

import java.time.LocalDate;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "consents")
public class Consent {

    @Id
    private String id;

    private String patientId;
    private String providerId;
    private String purpose;
    private String status;
    private LocalDate grantedOn;
    private LocalDate expiryDate;
    private Boolean revoked;

    public Consent() {
    }

    public Consent(String id, String patientId, String providerId,
                   String purpose, String status,
                   LocalDate grantedOn,
                   LocalDate expiryDate,
                   Boolean revoked) {
        this.id = id;
        this.patientId = patientId;
        this.providerId = providerId;
        this.purpose = purpose;
        this.status = status;
        this.grantedOn = grantedOn;
        this.expiryDate = expiryDate;
        this.revoked = revoked;
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

    public String getProviderId() {
        return providerId;
    }

    public void setProviderId(String providerId) {
        this.providerId = providerId;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getGrantedOn() {
        return grantedOn;
    }

    public void setGrantedOn(LocalDate grantedOn) {
        this.grantedOn = grantedOn;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public Boolean getRevoked() {
        return revoked;
    }

    public void setRevoked(Boolean revoked) {
        this.revoked = revoked;
    }
}