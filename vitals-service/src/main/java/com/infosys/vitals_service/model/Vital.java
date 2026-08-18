package com.infosys.vitals_service.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "vitals")
public class Vital {

    @Id
    private String id;

    private String patientId;
    private int heartRate;
    private int bpSystolic;
    private int bpDiastolic;
    private double temperature;
    private int spo2;
    private int steps;
    private double sleepHours;
    private int respirationRate;
    private LocalDateTime recordedAt;

    public Vital() {
    }

    public Vital(String id, String patientId, int heartRate, int bpSystolic,
                 int bpDiastolic, double temperature, int spo2,
                 int steps, double sleepHours, int respirationRate, LocalDateTime recordedAt) {

        this.id = id;
        this.patientId = patientId;
        this.heartRate = heartRate;
        this.bpSystolic = bpSystolic;
        this.bpDiastolic = bpDiastolic;
        this.temperature = temperature;
        this.spo2 = spo2;
        this.steps = steps;
        this.sleepHours = sleepHours;
        this.respirationRate = respirationRate;
        this.recordedAt = recordedAt;
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

    public int getHeartRate() {
        return heartRate;
    }

    public void setHeartRate(int heartRate) {
        this.heartRate = heartRate;
    }

    public int getBpSystolic() {
        return bpSystolic;
    }

    public void setBpSystolic(int bpSystolic) {
        this.bpSystolic = bpSystolic;
    }

    public int getBpDiastolic() {
        return bpDiastolic;
    }

    public void setBpDiastolic(int bpDiastolic) {
        this.bpDiastolic = bpDiastolic;
    }

    public double getTemperature() {
        return temperature;
    }

    public void setTemperature(double temperature) {
        this.temperature = temperature;
    }

    public int getSpo2() {
        return spo2;
    }

    public void setSpo2(int spo2) {
        this.spo2 = spo2;
    }

    public int getSteps() {
        return steps;
    }

    public void setSteps(int steps) {
        this.steps = steps;
    }

    public double getSleepHours() {
        return sleepHours;
    }

    public void setSleepHours(double sleepHours) {
        this.sleepHours = sleepHours;
    }

    public int getRespirationRate() {
        return respirationRate;
    }

    public void setRespirationRate(int respirationRate) {
        this.respirationRate = respirationRate;
    }

    public LocalDateTime getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(LocalDateTime recordedAt) {
        this.recordedAt = recordedAt;
    }
}