package com.medisphere.careplan_service.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for PUT /api/careplans/{carePlanId}/reject
 */
public class DoctorRejectRequest {

    @NotBlank(message = "rejectedBy is required")
    private String rejectedBy;

    @NotBlank(message = "reason is required")
    private String reason;

    public DoctorRejectRequest() {
    }

    public DoctorRejectRequest(String rejectedBy, String reason) {
        this.rejectedBy = rejectedBy;
        this.reason = reason;
    }

    public String getRejectedBy() {
        return rejectedBy;
    }

    public void setRejectedBy(String rejectedBy) {
        this.rejectedBy = rejectedBy;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
