package com.medisphere.careplan_service.service;

import java.util.List;

public record CarePlanRecommendationResult(
        String riskLevel,
        List<String> medications,
        String diet,
        String exercise,
        String sleepRecommendation,
        String waterIntake,
        Integer reviewIntervalDays,
        String lifestyleAdvice,
        String doctorNotes,
        String aiRecommendation,
        String generatedBy
) {}
