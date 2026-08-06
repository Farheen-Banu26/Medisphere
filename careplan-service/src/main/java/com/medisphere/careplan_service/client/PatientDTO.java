package com.medisphere.careplan_service.client;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Data Transfer Object for patient data fetched from patient-service.
 * Matches the patient-service /api/patients/{id} response shape.
 */
public record PatientDTO(
        String patientId,
        String firstName,
        String lastName,
        Integer age,
        @JsonProperty("gender") String gender,
        @JsonProperty("dob") String dob
) {}
