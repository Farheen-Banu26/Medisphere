package com.medisphere.predictionservice.dto;

public record HealthTwinDTO(
        String patientId,
        Integer age,
        String gender,
        Double height,
        Double weight,
        Double bmi,
        Double heartRate,
        Double systolicBP,
        Double diastolicBP,
        Double oxygen,
        Double temperature,
        Integer steps,
        Double sleepHours,
        Double cholesterol,
        Double bloodGlucose,
        Double hbA1c,
        String smokingHistory,
        String familyHistory
) {}
