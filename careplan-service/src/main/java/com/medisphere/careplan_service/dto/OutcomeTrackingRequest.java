package com.medisphere.careplan_service.dto;

/**
 * Request DTO for updating current health outcome metrics for a care plan.
 */
public class OutcomeTrackingRequest {

    private Double currentRisk;
    private Double currentWeight;
    private Double currentSystolicBP;
    private Double currentDiastolicBP;
    private Double currentBloodGlucose;
    private Double currentCholesterol;

    public OutcomeTrackingRequest() {
    }

    public OutcomeTrackingRequest(Double currentRisk,
                                  Double currentWeight,
                                  Double currentSystolicBP,
                                  Double currentDiastolicBP,
                                  Double currentBloodGlucose,
                                  Double currentCholesterol) {
        this.currentRisk = currentRisk;
        this.currentWeight = currentWeight;
        this.currentSystolicBP = currentSystolicBP;
        this.currentDiastolicBP = currentDiastolicBP;
        this.currentBloodGlucose = currentBloodGlucose;
        this.currentCholesterol = currentCholesterol;
    }

    public Double getCurrentRisk() {
        return currentRisk;
    }

    public void setCurrentRisk(Double currentRisk) {
        this.currentRisk = currentRisk;
    }

    public Double getCurrentWeight() {
        return currentWeight;
    }

    public void setCurrentWeight(Double currentWeight) {
        this.currentWeight = currentWeight;
    }

    public Double getCurrentSystolicBP() {
        return currentSystolicBP;
    }

    public void setCurrentSystolicBP(Double currentSystolicBP) {
        this.currentSystolicBP = currentSystolicBP;
    }

    public Double getCurrentDiastolicBP() {
        return currentDiastolicBP;
    }

    public void setCurrentDiastolicBP(Double currentDiastolicBP) {
        this.currentDiastolicBP = currentDiastolicBP;
    }

    public Double getCurrentBloodGlucose() {
        return currentBloodGlucose;
    }

    public void setCurrentBloodGlucose(Double currentBloodGlucose) {
        this.currentBloodGlucose = currentBloodGlucose;
    }

    public Double getCurrentCholesterol() {
        return currentCholesterol;
    }

    public void setCurrentCholesterol(Double currentCholesterol) {
        this.currentCholesterol = currentCholesterol;
    }
}
