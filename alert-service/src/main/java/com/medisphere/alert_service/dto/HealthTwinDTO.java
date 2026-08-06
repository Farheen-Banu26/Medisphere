package com.medisphere.alert_service.dto;

import java.time.LocalDateTime;

public record HealthTwinDTO(
        String twinId,
        String patientId,
        Integer age,
        String gender,
        Double height,
        Double weight,
        Double bmi,
        Integer heartRate,
        Integer systolicBP,
        Integer diastolicBP,
        Double oxygen,
        Double temperature,
        Integer steps,
        Double sleepHours,
        Double cholesterol,
        Double bloodGlucose,
        Double hbA1c,
        String smokingHistory,
        String familyHistory,
        LocalDateTime lastUpdatedAt
) {}
