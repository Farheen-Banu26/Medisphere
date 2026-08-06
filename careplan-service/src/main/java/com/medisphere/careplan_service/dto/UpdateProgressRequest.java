package com.medisphere.careplan_service.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request body for PUT /api/careplans/progress/{carePlanId}.
 * Updates the patient adherence percentage for a care plan.
 */
public class UpdateProgressRequest {

    @NotNull(message = "adherence is required")
    @Min(value = 0, message = "adherence must be between 0 and 100")
    @Max(value = 100, message = "adherence must be between 0 and 100")
    private Integer adherence;

    // ─── Getters & Setters ─────────────────────────────────────────

    public Integer getAdherence() {
        return adherence;
    }

    public void setAdherence(Integer adherence) {
        this.adherence = adherence;
    }
}
