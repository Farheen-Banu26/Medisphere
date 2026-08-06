package com.medisphere.careplan_service.dto;

/**
 * Response DTO representing validation status across clinical guidelines, drug interactions,
 * doctor approval, adherence, and outcome tracking metrics.
 */
public class ValidationSummaryResponse {

    private String clinicalGuidelineStatus;
    private String drugInteractionStatus;
    private String doctorApprovalStatus;
    private String adherenceStatus;
    private String outcomeTrackingStatus;
    private String overallStatus;

    public ValidationSummaryResponse() {
    }

    public ValidationSummaryResponse(String clinicalGuidelineStatus,
                                     String drugInteractionStatus,
                                     String doctorApprovalStatus,
                                     String adherenceStatus,
                                     String outcomeTrackingStatus,
                                     String overallStatus) {
        this.clinicalGuidelineStatus = clinicalGuidelineStatus;
        this.drugInteractionStatus = drugInteractionStatus;
        this.doctorApprovalStatus = doctorApprovalStatus;
        this.adherenceStatus = adherenceStatus;
        this.outcomeTrackingStatus = outcomeTrackingStatus;
        this.overallStatus = overallStatus;
    }

    public String getClinicalGuidelineStatus() {
        return clinicalGuidelineStatus;
    }

    public void setClinicalGuidelineStatus(String clinicalGuidelineStatus) {
        this.clinicalGuidelineStatus = clinicalGuidelineStatus;
    }

    public String getDrugInteractionStatus() {
        return drugInteractionStatus;
    }

    public void setDrugInteractionStatus(String drugInteractionStatus) {
        this.drugInteractionStatus = drugInteractionStatus;
    }

    public String getDoctorApprovalStatus() {
        return doctorApprovalStatus;
    }

    public void setDoctorApprovalStatus(String doctorApprovalStatus) {
        this.doctorApprovalStatus = doctorApprovalStatus;
    }

    public String getAdherenceStatus() {
        return adherenceStatus;
    }

    public void setAdherenceStatus(String adherenceStatus) {
        this.adherenceStatus = adherenceStatus;
    }

    public String getOutcomeTrackingStatus() {
        return outcomeTrackingStatus;
    }

    public void setOutcomeTrackingStatus(String outcomeTrackingStatus) {
        this.outcomeTrackingStatus = outcomeTrackingStatus;
    }

    public String getOverallStatus() {
        return overallStatus;
    }

    public void setOverallStatus(String overallStatus) {
        this.overallStatus = overallStatus;
    }
}
