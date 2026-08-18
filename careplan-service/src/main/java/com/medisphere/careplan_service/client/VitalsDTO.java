package com.medisphere.careplan_service.client;

import java.time.LocalDateTime;

public record VitalsDTO(
        String id,
        String patientId,
        Integer heartRate,
        Integer bpSystolic,
        Integer bpDiastolic,
        Double temperature,
        Integer spo2,
        Integer steps,
        Double sleepHours,
        LocalDateTime recordedAt
) {}
