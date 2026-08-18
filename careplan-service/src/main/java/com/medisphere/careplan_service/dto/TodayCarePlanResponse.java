package com.medisphere.careplan_service.dto;

import java.time.LocalDate;
import java.util.List;

import com.medisphere.careplan_service.model.CarePlan;
import com.medisphere.careplan_service.model.CarePlanComment;

/**
 * DTO representing today's care plan summary for a patient.
 */
public class TodayCarePlanResponse {

    private String carePlanId;
    private String patientId;
    private List<String> medications;
    private String diet;
    private String exercise;
    private String waterIntake;
    private String sleepRecommendation;
    private String doctorNotes;
    private LocalDate nextReview;

    // Phase 5 Adherence Tracking Fields
    private Integer adherence;
    private Boolean medicineTaken;
    private Boolean exerciseCompleted;
    private Boolean dietFollowed;
    private Boolean waterGoalCompleted;
    private Boolean sleepGoalCompleted;
    private Boolean bpChecked;
    private Boolean glucoseChecked;

    // Phase 6 Outcome Improvement Fields
    private Double riskImprovement;
    private Double weightImprovement;
    private Double bpImprovement;
    private Double glucoseImprovement;
    private Double cholesterolImprovement;

    // Phase 7 Provider Collaboration Fields
    private String latestDoctorComment;

    public TodayCarePlanResponse() {
    }

    public TodayCarePlanResponse(String patientId,
                                 List<String> medications,
                                 String diet,
                                 String exercise,
                                 String waterIntake,
                                 String sleepRecommendation,
                                 String doctorNotes,
                                 LocalDate nextReview,
                                 Integer adherence,
                                 Boolean medicineTaken,
                                 Boolean exerciseCompleted,
                                 Boolean dietFollowed,
                                 Boolean waterGoalCompleted,
                                 Boolean sleepGoalCompleted,
                                 Boolean bpChecked,
                                 Boolean glucoseChecked,
                                 Double riskImprovement,
                                 Double weightImprovement,
                                 Double bpImprovement,
                                 Double glucoseImprovement,
                                 Double cholesterolImprovement,
                                 String latestDoctorComment) {
        this.patientId = patientId;
        this.medications = medications;
        this.diet = diet;
        this.exercise = exercise;
        this.waterIntake = waterIntake;
        this.sleepRecommendation = sleepRecommendation;
        this.doctorNotes = doctorNotes;
        this.nextReview = nextReview;
        this.adherence = adherence;
        this.medicineTaken = medicineTaken;
        this.exerciseCompleted = exerciseCompleted;
        this.dietFollowed = dietFollowed;
        this.waterGoalCompleted = waterGoalCompleted;
        this.sleepGoalCompleted = sleepGoalCompleted;
        this.bpChecked = bpChecked;
        this.glucoseChecked = glucoseChecked;
        this.riskImprovement = riskImprovement;
        this.weightImprovement = weightImprovement;
        this.bpImprovement = bpImprovement;
        this.glucoseImprovement = glucoseImprovement;
        this.cholesterolImprovement = cholesterolImprovement;
        this.latestDoctorComment = latestDoctorComment;
    }

    public static TodayCarePlanResponse fromCarePlan(CarePlan plan) {
        if (plan == null) return null;

        String latestDocComment = null;
        if (plan.getComments() != null && !plan.getComments().isEmpty()) {
            for (int i = plan.getComments().size() - 1; i >= 0; i--) {
                CarePlanComment c = plan.getComments().get(i);
                if (c.getAuthorRole() != null && "DOCTOR".equalsIgnoreCase(c.getAuthorRole())) {
                    latestDocComment = c.getMessage();
                    break;
                }
            }
        }

        TodayCarePlanResponse resp = new TodayCarePlanResponse(
                plan.getPatientId(),
                plan.getMedications(),
                plan.getDiet(),
                plan.getExercise(),
                plan.getWaterIntake(),
                plan.getSleepRecommendation(),
                plan.getDoctorNotes(),
                plan.getNextReview(),
                plan.getAdherence(),
                plan.getMedicineTaken(),
                plan.getExerciseCompleted(),
                plan.getDietFollowed(),
                plan.getWaterGoalCompleted(),
                plan.getSleepGoalCompleted(),
                plan.getBpChecked(),
                plan.getGlucoseChecked(),
                plan.getRiskImprovement(),
                plan.getWeightImprovement(),
                plan.getBpImprovement(),
                plan.getGlucoseImprovement(),
                plan.getCholesterolImprovement(),
                latestDocComment
        );
        resp.setCarePlanId(plan.getCarePlanId() != null ? plan.getCarePlanId() : plan.getId());
        return resp;
    }

    public String getCarePlanId() {
        return carePlanId;
    }

    public void setCarePlanId(String carePlanId) {
        this.carePlanId = carePlanId;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
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

    public String getWaterIntake() {
        return waterIntake;
    }

    public void setWaterIntake(String waterIntake) {
        this.waterIntake = waterIntake;
    }

    public String getSleepRecommendation() {
        return sleepRecommendation;
    }

    public void setSleepRecommendation(String sleepRecommendation) {
        this.sleepRecommendation = sleepRecommendation;
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

    public Integer getAdherence() {
        return adherence;
    }

    public void setAdherence(Integer adherence) {
        this.adherence = adherence;
    }

    public Boolean getMedicineTaken() {
        return medicineTaken;
    }

    public void setMedicineTaken(Boolean medicineTaken) {
        this.medicineTaken = medicineTaken;
    }

    public Boolean getExerciseCompleted() {
        return exerciseCompleted;
    }

    public void setExerciseCompleted(Boolean exerciseCompleted) {
        this.exerciseCompleted = exerciseCompleted;
    }

    public Boolean getDietFollowed() {
        return dietFollowed;
    }

    public void setDietFollowed(Boolean dietFollowed) {
        this.dietFollowed = dietFollowed;
    }

    public Boolean getWaterGoalCompleted() {
        return waterGoalCompleted;
    }

    public void setWaterGoalCompleted(Boolean waterGoalCompleted) {
        this.waterGoalCompleted = waterGoalCompleted;
    }

    public Boolean getSleepGoalCompleted() {
        return sleepGoalCompleted;
    }

    public void setSleepGoalCompleted(Boolean sleepGoalCompleted) {
        this.sleepGoalCompleted = sleepGoalCompleted;
    }

    public Boolean getBpChecked() {
        return bpChecked;
    }

    public void setBpChecked(Boolean bpChecked) {
        this.bpChecked = bpChecked;
    }

    public Boolean getGlucoseChecked() {
        return glucoseChecked;
    }

    public void setGlucoseChecked(Boolean glucoseChecked) {
        this.glucoseChecked = glucoseChecked;
    }

    public Double getRiskImprovement() {
        return riskImprovement;
    }

    public void setRiskImprovement(Double riskImprovement) {
        this.riskImprovement = riskImprovement;
    }

    public Double getWeightImprovement() {
        return weightImprovement;
    }

    public void setWeightImprovement(Double weightImprovement) {
        this.weightImprovement = weightImprovement;
    }

    public Double getBpImprovement() {
        return bpImprovement;
    }

    public void setBpImprovement(Double bpImprovement) {
        this.bpImprovement = bpImprovement;
    }

    public Double getGlucoseImprovement() {
        return glucoseImprovement;
    }

    public void setGlucoseImprovement(Double glucoseImprovement) {
        this.glucoseImprovement = glucoseImprovement;
    }

    public Double getCholesterolImprovement() {
        return cholesterolImprovement;
    }

    public void setCholesterolImprovement(Double cholesterolImprovement) {
        this.cholesterolImprovement = cholesterolImprovement;
    }

    public String getLatestDoctorComment() {
        return latestDoctorComment;
    }

    public void setLatestDoctorComment(String latestDoctorComment) {
        this.latestDoctorComment = latestDoctorComment;
    }
}
