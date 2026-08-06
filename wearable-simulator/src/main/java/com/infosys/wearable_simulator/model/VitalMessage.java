package com.infosys.wearable_simulator.model;

import java.time.LocalDateTime;

public class VitalMessage {

    private String patientId;
    private Integer heartRate;
    private Integer bpSystolic;
    private Integer bpDiastolic;
    private Integer spo2;
    private Double temperature;
    private Integer respiration;
    private Integer steps;
    private Integer sleepHours;
    private LocalDateTime recordedAt;

    public VitalMessage() {
    }

    public VitalMessage(String patientId, Integer heartRate, Integer bpSystolic, Integer bpDiastolic,
                        Integer spo2, Double temperature, Integer respiration, Integer steps,
                        Integer sleepHours, LocalDateTime recordedAt) {
        this.patientId = patientId;
        this.heartRate = heartRate;
        this.bpSystolic = bpSystolic;
        this.bpDiastolic = bpDiastolic;
        this.spo2 = spo2;
        this.temperature = temperature;
        this.respiration = respiration;
        this.steps = steps;
        this.sleepHours = sleepHours;
        this.recordedAt = recordedAt;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
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

    public Integer getRespiration() {
        return respiration;
    }

    public void setRespiration(Integer respiration) {
        this.respiration = respiration;
    }

    public Integer getSteps() {
        return steps;
    }

    public void setSteps(Integer steps) {
        this.steps = steps;
    }

    public Integer getSleepHours() {
        return sleepHours;
    }

    public void setSleepHours(Integer sleepHours) {
        this.sleepHours = sleepHours;
    }

    public LocalDateTime getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(LocalDateTime recordedAt) {
        this.recordedAt = recordedAt;
    }
}
