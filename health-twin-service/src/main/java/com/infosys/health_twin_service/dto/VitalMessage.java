package com.infosys.health_twin_service.dto;

public class VitalMessage {

    private String patientId;
    private int heartRate;
    private int bpSystolic;
    private int bpDiastolic;
    private double temperature;
    private int spo2;
    private int steps;
    private double sleepHours;
    private Integer age;
    private String gender;
    private Double height;
    private Double weight;
    private Double cholesterol;
    private Double bloodGlucose;
    private Double hbA1c;
    private String smokingHistory;
    private String familyHistory;

    public VitalMessage() {
    }

    public VitalMessage(String patientId, int heartRate, int bpSystolic,
                        int bpDiastolic, double temperature,
                        int spo2, int steps, double sleepHours) {

        this.patientId = patientId;
        this.heartRate = heartRate;
        this.bpSystolic = bpSystolic;
        this.bpDiastolic = bpDiastolic;
        this.temperature = temperature;
        this.spo2 = spo2;
        this.steps = steps;
        this.sleepHours = sleepHours;
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

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public Double getHeight() {
        return height;
    }

    public void setHeight(Double height) {
        this.height = height;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public Double getCholesterol() {
        return cholesterol;
    }

    public void setCholesterol(Double cholesterol) {
        this.cholesterol = cholesterol;
    }

    public Double getBloodGlucose() {
        return bloodGlucose;
    }

    public void setBloodGlucose(Double bloodGlucose) {
        this.bloodGlucose = bloodGlucose;
    }

    public Double getHbA1c() {
        return hbA1c;
    }

    public void setHbA1c(Double hbA1c) {
        this.hbA1c = hbA1c;
    }

    public String getSmokingHistory() {
        return smokingHistory;
    }

    public void setSmokingHistory(String smokingHistory) {
        this.smokingHistory = smokingHistory;
    }

    public String getFamilyHistory() {
        return familyHistory;
    }

    public void setFamilyHistory(String familyHistory) {
        this.familyHistory = familyHistory;
    }
}