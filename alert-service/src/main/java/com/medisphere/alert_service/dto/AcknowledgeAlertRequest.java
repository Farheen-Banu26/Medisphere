package com.medisphere.alert_service.dto;

public class AcknowledgeAlertRequest {

    private String acknowledgedBy;

    public AcknowledgeAlertRequest() {
    }

    public AcknowledgeAlertRequest(String acknowledgedBy) {
        this.acknowledgedBy = acknowledgedBy;
    }

    public String getAcknowledgedBy() {
        return acknowledgedBy;
    }

    public void setAcknowledgedBy(String acknowledgedBy) {
        this.acknowledgedBy = acknowledgedBy;
    }
}
