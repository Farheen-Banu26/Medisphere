package com.medisphere.notification_service.dto;

public record PatientDTO(
        String patientId,
        String firstName,
        String lastName,
        String email,
        String phone
) {}
