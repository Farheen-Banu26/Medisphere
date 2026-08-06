package com.medisphere.careplan_service.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for PUT /api/careplans/approve/{carePlanId}.
 * The doctor sends their decision (APPROVED or REJECTED) with optional notes.
 */
public class ApproveCarePlanRequest {

    @NotBlank(message = "status is required (APPROVED or REJECTED)")
    private String status;

    private String doctorNotes;

    // ─── Getters & Setters ─────────────────────────────────────────

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDoctorNotes() {
        return doctorNotes;
    }

    public void setDoctorNotes(String doctorNotes) {
        this.doctorNotes = doctorNotes;
    }
}
