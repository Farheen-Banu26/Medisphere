package com.medisphere.careplan_service.dto;

import java.util.List;

public class UpdateCarePlanRequest {

    private String riskLevel;
    private String goal;
    private String clinicalSummary;
    private List<String> medications;
    private Object diet;
    private Object exercise;
    private String sleepRecommendation;
    private String waterIntake;
    private Object lifestyleAdvice;
    private List<String> monitoringRecommendations;
    private List<String> warningSigns;
    private Integer reviewIntervalDays;
    private String doctorNotes;
    private String lastModifiedBy;

    public UpdateCarePlanRequest() {}

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public String getGoal() {
        return goal;
    }

    public void setGoal(String goal) {
        this.goal = goal;
    }

    public String getClinicalSummary() {
        return clinicalSummary;
    }

    public void setClinicalSummary(String clinicalSummary) {
        this.clinicalSummary = clinicalSummary;
    }

    public List<String> getMedications() {
        return medications;
    }

    public void setMedications(List<String> medications) {
        this.medications = medications;
    }

    public Object getDiet() {
        return diet;
    }

    public void setDiet(Object diet) {
        this.diet = diet;
    }

    public Object getExercise() {
        return exercise;
    }

    public void setExercise(Object exercise) {
        this.exercise = exercise;
    }

    public String getSleepRecommendation() {
        return sleepRecommendation;
    }

    public void setSleepRecommendation(String sleepRecommendation) {
        this.sleepRecommendation = sleepRecommendation;
    }

    public String getWaterIntake() {
        return waterIntake;
    }

    public void setWaterIntake(String waterIntake) {
        this.waterIntake = waterIntake;
    }

    public Object getLifestyleAdvice() {
        return lifestyleAdvice;
    }

    public void setLifestyleAdvice(Object lifestyleAdvice) {
        this.lifestyleAdvice = lifestyleAdvice;
    }

    public List<String> getMonitoringRecommendations() {
        return monitoringRecommendations;
    }

    public void setMonitoringRecommendations(List<String> monitoringRecommendations) {
        this.monitoringRecommendations = monitoringRecommendations;
    }

    public List<String> getWarningSigns() {
        return warningSigns;
    }

    public void setWarningSigns(List<String> warningSigns) {
        this.warningSigns = warningSigns;
    }

    public Integer getReviewIntervalDays() {
        return reviewIntervalDays;
    }

    public void setReviewIntervalDays(Integer reviewIntervalDays) {
        this.reviewIntervalDays = reviewIntervalDays;
    }

    public String getDoctorNotes() {
        return doctorNotes;
    }

    public void setDoctorNotes(String doctorNotes) {
        this.doctorNotes = doctorNotes;
    }

    public String getLastModifiedBy() {
        return lastModifiedBy;
    }

    public void setLastModifiedBy(String lastModifiedBy) {
        this.lastModifiedBy = lastModifiedBy;
    }
}
