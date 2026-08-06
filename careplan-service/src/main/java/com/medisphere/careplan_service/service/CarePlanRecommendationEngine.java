package com.medisphere.careplan_service.service;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.medisphere.careplan_service.client.FlaskResponse;

public class CarePlanRecommendationEngine {

    private static final Logger logger = LoggerFactory.getLogger(CarePlanRecommendationEngine.class);

    public CarePlanRecommendationResult generate(FlaskResponse flaskResponse, String defaultRisk) {
        String risk = determineRiskLevel(flaskResponse, defaultRisk);
        return buildRecommendation(risk, "AI_GENERATED");
    }

    public CarePlanRecommendationResult generateFallback(String defaultRisk) {
        String risk = normalizeRisk(defaultRisk);
        if (risk == null || risk.isBlank()) {
            risk = "MODERATE";
        }
        return buildRecommendation(risk, "AI_FALLBACK");
    }

    private String determineRiskLevel(FlaskResponse response, String defaultRisk) {
        if (response == null || !"SUCCESS".equalsIgnoreCase(response.status())) {
            return normalizeRisk(defaultRisk) != null ? normalizeRisk(defaultRisk) : "MODERATE";
        }

        Map<String, Object> heart = response.heartDisease();
        Map<String, Object> diabetes = response.diabetes();

        String heartPred = heart != null && heart.get("prediction") != null ? heart.get("prediction").toString() : "";
        String diabetesPred = diabetes != null && diabetes.get("prediction") != null ? diabetes.get("prediction").toString() : "";

        double heartProb = getDoubleValue(heart, "probability");
        double diabetesProb = getDoubleValue(diabetes, "probability");

        if ("High Risk".equalsIgnoreCase(heartPred) || "High Risk".equalsIgnoreCase(diabetesPred) || heartProb >= 0.5 || diabetesProb >= 0.5) {
            return "HIGH";
        } else if (heartProb >= 0.25 || diabetesProb >= 0.25) {
            return "MODERATE";
        } else {
            return "LOW";
        }
    }

    private double getDoubleValue(Map<String, Object> map, String key) {
        if (map == null || !map.containsKey(key) || map.get(key) == null) {
            return 0.0;
        }
        try {
            return Double.parseDouble(map.get(key).toString());
        } catch (Exception e) {
            return 0.0;
        }
    }

    private String normalizeRisk(String risk) {
        if (risk == null) return null;
        String r = risk.trim().toUpperCase();
        if (r.contains("HIGH") || r.contains("CRITICAL")) return "HIGH";
        if (r.contains("MEDIUM") || r.contains("MODERATE")) return "MODERATE";
        if (r.contains("LOW")) return "LOW";
        return r;
    }

    private CarePlanRecommendationResult buildRecommendation(String riskLevel, String generatedBy) {
        return switch (riskLevel) {
            case "HIGH" -> new CarePlanRecommendationResult(
                    "HIGH",
                    List.of("Metformin", "Losartan"),
                    "Low Salt, Low Sugar, High Fiber Clinical Diet",
                    "30 min Walking, Yoga",
                    "8 Hours",
                    "3 Litres",
                    30,
                    "Daily BP & Glucose Monitoring, Avoid Stress, Regular Vitals Logging",
                    "High risk AI detection. Strict adherence required. Re-evaluate in 30 days.",
                    "High AI Risk Score detected. Intensive clinical monitoring and combination pharmacotherapy recommended.",
                    generatedBy
            );
            case "LOW" -> new CarePlanRecommendationResult(
                    "LOW",
                    List.of("Preventative Multivitamin"),
                    "Healthy Lifestyle Diet, High Vegetables & Whole Grains",
                    "Maintain Exercise (150 min/week)",
                    "7-8 Hours",
                    "2.5 Litres",
                    90,
                    "Annual Health Checkup, Maintain Healthy BMI & Activity",
                    "Low risk profile. Maintain current wellness routine.",
                    "Low Risk profile. Preventive maintenance and wellness maintenance plan recommended.",
                    generatedBy
            );
            default -> new CarePlanRecommendationResult(
                    "MODERATE",
                    List.of("Atorvastatin", "Daily Multivitamin"),
                    "Healthy Balanced Diet, Low Sodium & Reduced Processed Foods",
                    "Moderate Exercise 45 min 4x/week, Brisk Walking",
                    "7-8 Hours",
                    "2.5 Litres",
                    60,
                    "Active Lifestyle, Monitor Weight & Blood Pressure Weekly",
                    "Moderate risk profile. Lifestyle interventions recommended. Review in 60 days.",
                    "Moderate AI Risk level. Targeted lifestyle modifications and routine monitoring plan activated.",
                    generatedBy
            );
        };
    }
}
