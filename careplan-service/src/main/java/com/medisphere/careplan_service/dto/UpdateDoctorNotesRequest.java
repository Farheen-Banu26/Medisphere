package com.medisphere.careplan_service.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for PUT /api/careplans/{carePlanId}/doctor-notes
 */
public class UpdateDoctorNotesRequest {

    @NotBlank(message = "doctorNotes is required")
    private String doctorNotes;

    private String lastModifiedBy;

    public UpdateDoctorNotesRequest() {
    }

    public UpdateDoctorNotesRequest(String doctorNotes) {
        this.doctorNotes = doctorNotes;
    }

    public UpdateDoctorNotesRequest(String doctorNotes, String lastModifiedBy) {
        this.doctorNotes = doctorNotes;
        this.lastModifiedBy = lastModifiedBy;
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
