package com.medisphere.careplan_service.dto;

import java.time.LocalDateTime;

import com.medisphere.careplan_service.model.CarePlan;

/**
 * Response DTO representing measurable health outcome improvements for a care plan.
 */
public class OutcomeSummaryResponse {

    private String carePlanId;
    private String patientId;

    private Double initialRisk;
    private Double currentRisk;
    private Double riskImprovement;

    private Double initialWeight;
    private Double currentWeight;
    private Double weightImprovement;

    private Double initialSystolicBP;
    private Double currentSystolicBP;
    private Double initialDiastolicBP;
    private Double currentDiastolicBP;
    private Double bpImprovement;

    private Double initialBloodGlucose;
    private Double currentBloodGlucose;
    private Double glucoseImprovement;

    private Double initialCholesterol;
    private Double currentCholesterol;
    private Double cholesterolImprovement;

    private LocalDateTime outcomeLastUpdated;

    public OutcomeSummaryResponse() {
    }

    public OutcomeSummaryResponse(String carePlanId,
                                  String patientId,
                                  Double initialRisk,
                                  Double currentRisk,
                                  Double riskImprovement,
                                  Double initialWeight,
                                  Double currentWeight,
                                  Double weightImprovement,
                                  Double initialSystolicBP,
                                  Double currentSystolicBP,
                                  Double initialDiastolicBP,
                                  Double currentDiastolicBP,
                                  Double bpImprovement,
                                  Double initialBloodGlucose,
                                  Double currentBloodGlucose,
                                  Double glucoseImprovement,
                                  Double initialCholesterol,
                                  Double currentCholesterol,
                                  Double cholesterolImprovement,
                                  LocalDateTime outcomeLastUpdated) {
        this.carePlanId = carePlanId;
        this.patientId = patientId;
        this.initialRisk = initialRisk;
        this.currentRisk = currentRisk;
        this.riskImprovement = riskImprovement;
        this.initialWeight = initialWeight;
        this.currentWeight = currentWeight;
        this.weightImprovement = weightImprovement;
        this.initialSystolicBP = initialSystolicBP;
        this.currentSystolicBP = currentSystolicBP;
        this.initialDiastolicBP = initialDiastolicBP;
        this.currentDiastolicBP = currentDiastolicBP;
        this.bpImprovement = bpImprovement;
        this.initialBloodGlucose = initialBloodGlucose;
        this.currentBloodGlucose = currentBloodGlucose;
        this.glucoseImprovement = glucoseImprovement;
        this.initialCholesterol = initialCholesterol;
        this.currentCholesterol = currentCholesterol;
        this.cholesterolImprovement = cholesterolImprovement;
        this.outcomeLastUpdated = outcomeLastUpdated;
    }

    public static OutcomeSummaryResponse fromCarePlan(CarePlan plan) {
        if (plan == null) return null;
        return new OutcomeSummaryResponse(
                plan.getCarePlanId(),
                plan.getPatientId(),
                plan.getInitialRisk(),
                plan.getCurrentRisk(),
                plan.getRiskImprovement(),
                plan.getInitialWeight(),
                plan.getCurrentWeight(),
                plan.getWeightImprovement(),
                plan.getInitialSystolicBP(),
                plan.getCurrentSystolicBP(),
                plan.getInitialDiastolicBP(),
                plan.getCurrentDiastolicBP(),
                plan.getBpImprovement(),
                plan.getInitialBloodGlucose(),
                plan.getCurrentBloodGlucose(),
                plan.getGlucoseImprovement(),
                plan.getInitialCholesterol(),
                plan.getCurrentCholesterol(),
                plan.getCholesterolImprovement(),
                plan.getOutcomeLastUpdated()
        );
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

    public Double getRiskImprovement() {
        return riskImprovement;
    }

    public void setRiskImprovement(Double riskImprovement) {
        this.riskImprovement = riskImprovement;
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

    public Double getWeightImprovement() {
        return weightImprovement;
    }

    public void setWeightImprovement(Double weightImprovement) {
        this.weightImprovement = weightImprovement;
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

    public Double getBpImprovement() {
        return bpImprovement;
    }

    public void setBpImprovement(Double bpImprovement) {
        this.bpImprovement = bpImprovement;
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

    public Double getGlucoseImprovement() {
        return glucoseImprovement;
    }

    public void setGlucoseImprovement(Double glucoseImprovement) {
        this.glucoseImprovement = glucoseImprovement;
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
}
