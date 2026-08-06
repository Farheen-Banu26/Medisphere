package com.medisphere.predictionservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PatientDTO(
        String patientId,
        String firstName,
        String lastName,
        Integer age,
        @JsonProperty("gender") String gender,
        @JsonProperty("dob") String dob
) {}
