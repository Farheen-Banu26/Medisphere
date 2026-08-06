package com.medisphere.careplan_service.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for PUT /api/careplans/{carePlanId}/approve
 */
public class DoctorApproveRequest {

    @NotBlank(message = "approvedBy is required")
    private String approvedBy;

    private String doctorNotes;

    public DoctorApproveRequest() {
    }

    public DoctorApproveRequest(String approvedBy, String doctorNotes) {
        this.approvedBy = approvedBy;
        this.doctorNotes = doctorNotes;
    }

    public String getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
    }

    public String getDoctorNotes() {
        return doctorNotes;
    }

    public void setDoctorNotes(String doctorNotes) {
        this.doctorNotes = doctorNotes;
    }
}
