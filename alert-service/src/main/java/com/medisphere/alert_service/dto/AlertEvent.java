package com.medisphere.alert_service.dto;

import java.time.LocalDateTime;

import com.medisphere.alert_service.model.Alert;
import com.medisphere.alert_service.model.AlertSeverity;
import com.medisphere.alert_service.model.AlertStatus;

public class AlertEvent {

    private String alertId;
    private String patientId;
    private String type;
    private AlertSeverity severity;
    private String message;
    private String source;
    private AlertStatus status;

    private Integer heartRate;
    private Integer bpSystolic;
    private Integer bpDiastolic;
    private Integer spo2;
    private Double temperature;

    private String prediction;
    private String risk;
    private Double confidence;
    private String aiRecommendation;
    private LocalDateTime predictionTimestamp;

    private LocalDateTime createdAt;

    public AlertEvent() {
    }

    public static AlertEvent fromAlert(Alert alert) {
        AlertEvent event = new AlertEvent();
        event.setAlertId(alert.getAlertId());
        event.setPatientId(alert.getPatientId());
        event.setType(alert.getType());
        event.setSeverity(alert.getSeverity());
        event.setMessage(alert.getMessage());
        event.setSource(alert.getSource());
        event.setStatus(alert.getStatus());
        event.setHeartRate(alert.getHeartRate());
        event.setBpSystolic(alert.getBpSystolic());
        event.setBpDiastolic(alert.getBpDiastolic());
        event.setSpo2(alert.getSpo2());
        event.setTemperature(alert.getTemperature());
        event.setPrediction(alert.getPrediction());
        event.setRisk(alert.getRisk());
        event.setConfidence(alert.getConfidence());
        event.setAiRecommendation(alert.getAiRecommendation());
        event.setPredictionTimestamp(alert.getPredictionTimestamp());
        event.setCreatedAt(alert.getCreatedAt());
        return event;
    }

    public String getAlertId() {
        return alertId;
    }

    public void setAlertId(String alertId) {
        this.alertId = alertId;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
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

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public AlertStatus getStatus() {
        return status;
    }

    public void setStatus(AlertStatus status) {
        this.status = status;
    }

    public Integer getHeartRate() {
        return heartRate;
    }

    public void setHeartRate(Integer heartRate) {
        this.heartRate = heartRate;
    }

    public Integer getBpSystolic() {
        return bpSystolic;
    }

    public void setBpSystolic(Integer bpSystolic) {
        this.bpSystolic = bpSystolic;
    }

    public Integer getBpDiastolic() {
        return bpDiastolic;
    }

    public void setBpDiastolic(Integer bpDiastolic) {
        this.bpDiastolic = bpDiastolic;
    }

    public Integer getSpo2() {
        return spo2;
    }

    public void setSpo2(Integer spo2) {
        this.spo2 = spo2;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getPrediction() {
        return prediction;
    }

    public void setPrediction(String prediction) {
        this.prediction = prediction;
    }

    public String getRisk() {
        return risk;
    }

    public void setRisk(String risk) {
        this.risk = risk;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public String getAiRecommendation() {
        return aiRecommendation;
    }

    public void setAiRecommendation(String aiRecommendation) {
        this.aiRecommendation = aiRecommendation;
    }

    public LocalDateTime getPredictionTimestamp() {
        return predictionTimestamp;
    }

    public void setPredictionTimestamp(LocalDateTime predictionTimestamp) {
        this.predictionTimestamp = predictionTimestamp;
    }
}
