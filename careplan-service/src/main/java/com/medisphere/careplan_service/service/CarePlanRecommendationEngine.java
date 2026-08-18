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
                    "High-Risk Cardiovascular & Metabolic Clinical Care Goal",
                    "High risk AI detection. Intensive clinical monitoring and combination pharmacotherapy recommended based on elevated health risk profile.",
                    List.of("Metformin 500mg Twice Daily", "Losartan 50mg Once Daily"),
                    "Low Salt (<2g/day), Low Sugar, High Fiber Clinical Diet",
                    "30 min Brisk Walking, Light Exercise, Avoid Strenuous Overexertion",
                    "8 Hours Restful Sleep Nightly",
                    "3.0 Litres Daily Target",
                    30,
                    "Daily BP & Glucose Monitoring, Avoid Stress, Log Vitals Regularly",
                    List.of("Check Blood Pressure twice daily", "Measure Blood Glucose daily before breakfast", "Track SpO2 post-exertion"),
                    List.of("Chest pain or pressure", "Shortness of breath at rest", "SpO2 < 92%", "Systolic BP > 180 mmHg"),
                    "High risk AI detection. Strict adherence required. Re-evaluate in 30 days.",
                    "High AI Risk Score detected. Intensive clinical monitoring and combination pharmacotherapy recommended.",
                    generatedBy
            );
            case "LOW" -> new CarePlanRecommendationResult(
                    "LOW",
                    "Preventative Wellness & Healthy Maintenance Goal",
                    "Low Risk profile. Preventive maintenance and wellness routine recommended based on normal vital signs and low prediction risk.",
                    List.of("Daily Preventative Multivitamin"),
                    "Healthy Balanced Diet, Rich in Vegetables, Fruits, and Whole Grains",
                    "Maintain Active Lifestyle (150 mins moderate physical activity per week)",
                    "7-8 Hours Restful Sleep Nightly",
                    "2.5 Litres Daily Target",
                    90,
                    "Annual Health Checkup, Maintain Healthy BMI & Active Lifestyle",
                    List.of("Check Blood Pressure monthly", "Track daily steps (target 8,000 steps)"),
                    List.of("Persistent fatigue", "Unexplained weight changes", "Dizziness or fainting"),
                    "Low risk profile. Maintain current wellness routine.",
                    "Low Risk profile. Preventive maintenance and wellness maintenance plan recommended.",
                    generatedBy
            );
            default -> new CarePlanRecommendationResult(
                    "MODERATE",
                    "Cardiovascular Risk Reduction & Targeted Lifestyle Optimization",
                    "Moderate AI Risk level. Targeted lifestyle modifications and routine monitoring plan activated to manage baseline risk factors.",
                    List.of("Atorvastatin 10mg Daily", "Daily Multivitamin"),
                    "Healthy Balanced Diet, Low Sodium & Reduced Processed Foods",
                    "Moderate Exercise 45 min 4x/week, Brisk Walking",
                    "7-8 Hours Restful Sleep Nightly",
                    "2.5 Litres Daily Target",
                    60,
                    "Active Lifestyle, Monitor Weight & Blood Pressure Weekly",
                    List.of("Check Blood Pressure 3x weekly", "Monitor weekly weight trends"),
                    List.of("Persistent elevated BP (>140/90 mmHg)", "Shortness of breath on mild exertion"),
                    "Moderate risk profile. Lifestyle interventions recommended. Review in 60 days.",
                    "Moderate AI Risk level. Targeted lifestyle modifications and routine monitoring plan activated.",
                    generatedBy
            );
        };
    }
}
