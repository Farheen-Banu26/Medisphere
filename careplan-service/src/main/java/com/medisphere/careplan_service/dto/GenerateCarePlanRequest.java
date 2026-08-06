package com.medisphere.careplan_service.dto;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/**
 * Request body for POST /api/careplans/generate.
 *
 * Phase 1: accept and persist the care plan as provided.
 * Phase 2 will replace manual fields with AI-generated recommendations.
 */
public class GenerateCarePlanRequest {

    @NotBlank(message = "patientId is required")
    private String patientId;

    /** Risk level coming from the prediction service (optional in Phase 1). */
    private String predictionRisk;

    private String goal;

    private List<String> medications;

    private String diet;

    private String exercise;

    private String sleepRecommendation;

    private String waterIntake;

    private String doctorNotes;

    private LocalDate nextReview;

    // ─── Getters & Setters ─────────────────────────────────────────

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getPredictionRisk() {
        return predictionRisk;
    }

    public void setPredictionRisk(String predictionRisk) {
        this.predictionRisk = predictionRisk;
    }

    public String getGoal() {
        return goal;
    }

    public void setGoal(String goal) {
        this.goal = goal;
    }

    public List<String> getMedications() {
        return medications;
    }

    public void setMedications(List<String> medications) {
        this.medications = medications;
    }

    public String getDiet() {
        return diet;
    }

    public void setDiet(String diet) {
        this.diet = diet;
    }

    public String getExercise() {
        return exercise;
    }

    public void setExercise(String exercise) {
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

    public String getDoctorNotes() {
        return doctorNotes;
    }

    public void setDoctorNotes(String doctorNotes) {
        this.doctorNotes = doctorNotes;
    }

    public LocalDate getNextReview() {
        return nextReview;
    }

    public void setNextReview(LocalDate nextReview) {
        this.nextReview = nextReview;
    }
}
