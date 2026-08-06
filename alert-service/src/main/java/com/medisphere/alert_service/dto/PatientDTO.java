package com.medisphere.alert_service.dto;

public record PatientDTO(
        String patientId,
        String firstName,
        String lastName,
        String dob,
        String gender,
        String contactNumber,
        String email,
        String address,
        String emergencyContactName,
        String emergencyContactNumber,
        Integer age
) {}
