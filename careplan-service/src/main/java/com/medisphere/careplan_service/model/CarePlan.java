package com.medisphere.careplan_service.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * MongoDB document representing a patient's care plan.
 * Stored in the "careplans" collection inside careplandb.
 */
@Document(collection = "careplans")
public class CarePlan {

    @Id
    private String id;

    /** Business identifier, e.g. "CP-UUID" */
    @Indexed(unique = true)
    private String carePlanId;

    @Indexed
    private String patientId;

    /** Risk level from the prediction service, e.g. "HIGH", "MODERATE", "LOW" */
    private String predictionRisk;

    /** Overall clinical goal for this care plan */
    private String goal;

    /** List of prescribed medications */
    private List<String> medications;

    /** Dietary guidance */
    private String diet;

    /** Exercise recommendations */
    private String exercise;

    /** Sleep recommendations */
    private String sleepRecommendation;

    /** Daily water intake target (e.g. "2.5 litres") */
    private String waterIntake;

    /** Free-text notes entered by the attending doctor */
    private String doctorNotes;

    /**
     * Doctor review status: PENDING, APPROVED, REJECTED.
     * Defaults to PENDING on creation.
     */
    private DoctorStatus doctorStatus;

    /**
     * Patient adherence percentage (0–100).
     * Updated via the progress endpoint.
     */
    private Integer adherence;

    /** Date of the next scheduled review */
    private LocalDate nextReview;

    // ─── Phase 2: AI Generation Fields ───────────────────────────

    /** Computed risk level: HIGH, MODERATE, LOW — derived from Flask AI output */
    private String riskLevel;

    /** Narrative AI recommendation summary */
    private String aiRecommendation;

    /** Clinical summary narrative from Gemini / AI decision support */
    private String clinicalSummary;

    /** Lifestyle advice bullet points from the recommendation engine */
    private String lifestyleAdvice;

    /** List of monitoring recommendations for patient */
    private List<String> monitoringRecommendations = new java.util.ArrayList<>();

    /** Red-flag warning signs requiring urgent attention */
    private List<String> warningSigns = new java.util.ArrayList<>();

    /** Snapshot of clinical inputs (Patient Info, Vitals with recordedAt, Risk, History) used by Gemini */
    private java.util.Map<String, Object> clinicalInputs = new java.util.LinkedHashMap<>();

    /** Review interval in days (e.g. 30, 60, 90) */
    private Integer reviewIntervalDays;

    /** Who/what generated this care plan: AI_GENERATED, AI_FALLBACK, MANUAL */
    private String generatedBy;

    /** Timestamp of AI generation */
    private LocalDateTime generationTime;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // ─── Phase 3: Doctor Approval Workflow Fields ───────────────

    private String approvedBy;

    private LocalDateTime approvedAt;

    private String rejectedBy;

    private LocalDateTime rejectedAt;

    private String rejectedReason;

    private String lastModifiedBy;

    private LocalDateTime lastModifiedAt;

    // ─── Phase 5: Adherence Tracking Fields ────────────────────

    private Boolean medicineTaken;

    private Boolean exerciseCompleted;

    private Boolean dietFollowed;

    private Boolean waterGoalCompleted;

    private Boolean sleepGoalCompleted;

    private Boolean bpChecked;

    private Boolean glucoseChecked;

    private LocalDateTime lastAdherenceUpdate;

    // ─── Phase 6: Outcome Tracking Fields ──────────────────────

    private Double initialRisk;
    private Double currentRisk;

    private Double initialWeight;
    private Double currentWeight;

    private Double initialSystolicBP;
    private Double currentSystolicBP;

    private Double initialDiastolicBP;
    private Double currentDiastolicBP;

    private Double initialBloodGlucose;
    private Double currentBloodGlucose;

    private Double initialCholesterol;
    private Double currentCholesterol;

    private Double riskImprovement;
    private Double weightImprovement;
    private Double bpImprovement;
    private Double glucoseImprovement;
    private Double cholesterolImprovement;

    private LocalDateTime outcomeLastUpdated;

    // ─── Phase 7: Provider Collaboration Fields ────────────────

    private List<CarePlanComment> comments = new java.util.ArrayList<>();

    // ─── Phase 9: Audit Trail Fields ───────────────────────────

    private List<AuditLog> auditLogs = new java.util.ArrayList<>();

    // ─── Constructors ────────────────────────────────────────────

    public CarePlan() {
    }

    // ─── Getters and Setters ──────────────────────────────────────

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public DoctorStatus getDoctorStatus() {
        return doctorStatus;
    }

    public void setDoctorStatus(DoctorStatus doctorStatus) {
        this.doctorStatus = doctorStatus;
    }

    public Integer getAdherence() {
        return adherence;
    }

    public void setAdherence(Integer adherence) {
        this.adherence = adherence;
    }

    public LocalDate getNextReview() {
        return nextReview;
    }

    public void setNextReview(LocalDate nextReview) {
        this.nextReview = nextReview;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public String getAiRecommendation() {
        return aiRecommendation != null ? aiRecommendation : clinicalSummary;
    }

    public void setAiRecommendation(String aiRecommendation) {
        this.aiRecommendation = aiRecommendation;
        if (this.clinicalSummary == null) {
            this.clinicalSummary = aiRecommendation;
        }
    }

    public String getClinicalSummary() {
        return clinicalSummary != null ? clinicalSummary : aiRecommendation;
    }

    public void setClinicalSummary(String clinicalSummary) {
        this.clinicalSummary = clinicalSummary;
        if (this.aiRecommendation == null) {
            this.aiRecommendation = clinicalSummary;
        }
    }

    public List<String> getMonitoringRecommendations() {
        if (monitoringRecommendations == null) {
            monitoringRecommendations = new java.util.ArrayList<>();
        }
        return monitoringRecommendations;
    }

    public void setMonitoringRecommendations(List<String> monitoringRecommendations) {
        this.monitoringRecommendations = monitoringRecommendations;
    }

    public List<String> getWarningSigns() {
        if (warningSigns == null) {
            warningSigns = new java.util.ArrayList<>();
        }
        return warningSigns;
    }

    public void setWarningSigns(List<String> warningSigns) {
        this.warningSigns = warningSigns;
    }

    public java.util.Map<String, Object> getClinicalInputs() {
        if (clinicalInputs == null) {
            clinicalInputs = new java.util.LinkedHashMap<>();
        }
        return clinicalInputs;
    }

    public void setClinicalInputs(java.util.Map<String, Object> clinicalInputs) {
        this.clinicalInputs = clinicalInputs;
    }

    public String getLifestyleAdvice() {
        return lifestyleAdvice;
    }

    public void setLifestyleAdvice(String lifestyleAdvice) {
        this.lifestyleAdvice = lifestyleAdvice;
    }

    public Integer getReviewIntervalDays() {
        return reviewIntervalDays;
    }

    public void setReviewIntervalDays(Integer reviewIntervalDays) {
        this.reviewIntervalDays = reviewIntervalDays;
    }

    public String getGeneratedBy() {
        return generatedBy;
    }

    public void setGeneratedBy(String generatedBy) {
        this.generatedBy = generatedBy;
    }

    public LocalDateTime getGenerationTime() {
        return generationTime;
    }

    public void setGenerationTime(LocalDateTime generationTime) {
        this.generationTime = generationTime;
    }

    public String getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public String getRejectedBy() {
        return rejectedBy;
    }

    public void setRejectedBy(String rejectedBy) {
        this.rejectedBy = rejectedBy;
    }

    public LocalDateTime getRejectedAt() {
        return rejectedAt;
    }

    public void setRejectedAt(LocalDateTime rejectedAt) {
        this.rejectedAt = rejectedAt;
    }

    public String getRejectedReason() {
        return rejectedReason;
    }

    public void setRejectedReason(String rejectedReason) {
        this.rejectedReason = rejectedReason;
    }

    public String getLastModifiedBy() {
        return lastModifiedBy;
    }

    public void setLastModifiedBy(String lastModifiedBy) {
        this.lastModifiedBy = lastModifiedBy;
    }

    public LocalDateTime getLastModifiedAt() {
        return lastModifiedAt;
    }

    public void setLastModifiedAt(LocalDateTime lastModifiedAt) {
        this.lastModifiedAt = lastModifiedAt;
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

    public LocalDateTime getLastAdherenceUpdate() {
        return lastAdherenceUpdate;
    }

    public void setLastAdherenceUpdate(LocalDateTime lastAdherenceUpdate) {
        this.lastAdherenceUpdate = lastAdherenceUpdate;
    }

    public Double getInitialRisk() {
        return initialRisk;
    }

    public void setInitialRisk(Double initialRisk) {
        this.initialRisk = initialRisk;
    }

    public Double getCurrentRisk() {
        return currentRisk;
    }

    public void setCurrentRisk(Double currentRisk) {
        this.currentRisk = currentRisk;
    }

    public Double getInitialWeight() {
        return initialWeight;
    }

    public void setInitialWeight(Double initialWeight) {
        this.initialWeight = initialWeight;
    }

    public Double getCurrentWeight() {
        return currentWeight;
    }

    public void setCurrentWeight(Double currentWeight) {
        this.currentWeight = currentWeight;
    }

    public Double getInitialSystolicBP() {
        return initialSystolicBP;
    }

    public void setInitialSystolicBP(Double initialSystolicBP) {
        this.initialSystolicBP = initialSystolicBP;
    }

    public Double getCurrentSystolicBP() {
        return currentSystolicBP;
    }

    public void setCurrentSystolicBP(Double currentSystolicBP) {
        this.currentSystolicBP = currentSystolicBP;
    }

    public Double getInitialDiastolicBP() {
        return initialDiastolicBP;
    }

    public void setInitialDiastolicBP(Double initialDiastolicBP) {
        this.initialDiastolicBP = initialDiastolicBP;
    }

    public Double getCurrentDiastolicBP() {
        return currentDiastolicBP;
    }

    public void setCurrentDiastolicBP(Double currentDiastolicBP) {
        this.currentDiastolicBP = currentDiastolicBP;
    }

    public Double getInitialBloodGlucose() {
        return initialBloodGlucose;
    }

    public void setInitialBloodGlucose(Double initialBloodGlucose) {
        this.initialBloodGlucose = initialBloodGlucose;
    }

    public Double getCurrentBloodGlucose() {
        return currentBloodGlucose;
    }

    public void setCurrentBloodGlucose(Double currentBloodGlucose) {
        this.currentBloodGlucose = currentBloodGlucose;
    }

    public Double getInitialCholesterol() {
        return initialCholesterol;
    }

    public void setInitialCholesterol(Double initialCholesterol) {
        this.initialCholesterol = initialCholesterol;
    }

    public Double getCurrentCholesterol() {
        return currentCholesterol;
    }

    public void setCurrentCholesterol(Double currentCholesterol) {
        this.currentCholesterol = currentCholesterol;
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

    public LocalDateTime getOutcomeLastUpdated() {
        return outcomeLastUpdated;
    }

    public void setOutcomeLastUpdated(LocalDateTime outcomeLastUpdated) {
        this.outcomeLastUpdated = outcomeLastUpdated;
    }

    public List<CarePlanComment> getComments() {
        if (comments == null) {
            comments = new java.util.ArrayList<>();
        }
        return comments;
    }

    public void setComments(List<CarePlanComment> comments) {
        this.comments = comments;
    }

    public List<AuditLog> getAuditLogs() {
        if (auditLogs == null) {
            auditLogs = new java.util.ArrayList<>();
        }
        return auditLogs;
    }

    public void setAuditLogs(List<AuditLog> auditLogs) {
        this.auditLogs = auditLogs;
    }

    public void addAuditLog(String action, String performedBy, String performedRole, String description) {
        getAuditLogs().add(new AuditLog(
                "AUD-" + java.util.UUID.randomUUID().toString().toUpperCase(),
                action,
                performedBy,
                performedRole,
                description,
                LocalDateTime.now()
        ));
    }
}






