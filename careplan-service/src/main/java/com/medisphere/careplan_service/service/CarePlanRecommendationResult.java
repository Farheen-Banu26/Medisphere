package com.medisphere.careplan_service.service;

import java.util.List;

public record CarePlanRecommendationResult(
        String riskLevel,
        String goal,
        String clinicalSummary,
        List<String> medications,
        String diet,
        String exercise,
        String sleepRecommendation,
        String waterIntake,
        Integer reviewIntervalDays,
        String lifestyleAdvice,
        List<String> monitoringRecommendations,
        List<String> warningSigns,
        String doctorNotes,
        String aiRecommendation,
        String generatedBy
) {}
