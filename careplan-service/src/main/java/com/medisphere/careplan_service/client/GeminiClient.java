package com.medisphere.careplan_service.client;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medisphere.careplan_service.model.CarePlan;
import com.medisphere.careplan_service.service.CarePlanRecommendationResult;

/**
 * Server-side client for Google Gemini REST API (gemini-1.5-flash / gemini-2.0-flash / configured model).
 * Securely uses GEMINI_API_KEY from environment variables / backend configuration.
 * Never exposes the API key to the frontend.
 */
@Component
public class GeminiClient {

    private static final Logger logger = LoggerFactory.getLogger(GeminiClient.class);

    private final String apiKey;
    private final String modelName;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiClient(
            @Value("${gemini.api.key:${GEMINI_API_KEY:}}") String apiKey,
            @Value("${gemini.model:gemini-1.5-flash}") String modelName) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.modelName = modelName != null ? modelName.trim() : "gemini-1.5-flash";
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public boolean isConfigured() {
        return !apiKey.isBlank();
    }

    public CarePlanRecommendationResult generateCarePlan(
            PatientDTO patient,
            VitalsDTO vitals,
            HealthTwinDTO twin,
            FlaskResponse flaskResponse,
            String defaultRisk,
            List<CarePlan> previousCarePlans) {

        if (!isConfigured()) {
            logger.warn("GEMINI_API_KEY is not set in backend environment. Returning null for fallback execution.");
            return null;
        }

        String prompt = buildClinicalPrompt(patient, vitals, twin, flaskResponse, defaultRisk, previousCarePlans);
        String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;

        try {
            logger.info("Invoking Gemini API ({}) for patient {}", modelName, patient != null ? patient.patientId() : "N/A");

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", prompt)
                            ))
                    ),
                    "generationConfig", Map.of(
                            "temperature", 0.2,
                            "responseMimeType", "application/json"
                    )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return parseGeminiResponse(response.getBody(), defaultRisk);
            } else {
                logger.error("Gemini API returned status {}", response.getStatusCode());
                return null;
            }
        } catch (Exception ex) {
            logger.error("Gemini API invocation failed: {}", ex.getMessage(), ex);
            return null;
        }
    }

    private String buildClinicalPrompt(
            PatientDTO patient,
            VitalsDTO vitals,
            HealthTwinDTO twin,
            FlaskResponse flaskResponse,
            String defaultRisk,
            List<CarePlan> previousCarePlans) {

        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert clinical AI decision-support system for MediSphere.\n");
        sb.append("Your task is to generate a highly personalized, evidence-based draft medical Care Plan based strictly on the patient's actual clinical data provided below.\n\n");

        sb.append("IMPORTANT CLINICAL RULES & SAFETY INSTRUCTIONS:\n");
        sb.append("1. Use ONLY the provided patient clinical information.\n");
        sb.append("2. Do NOT invent patient values, vitals, or laboratory results.\n");
        sb.append("3. Do NOT invent diagnoses or claim certainty where data does not support it.\n");
        sb.append("4. Explicitly identify any abnormal current vitals (elevated HR, high BP, reduced SpO2, elevated temp) in the clinical summary.\n");
        sb.append("5. Tailor all recommendations (medications, diet, exercise, monitoring, warning signs) directly to this patient's unique clinical profile.\n");
        sb.append("6. The output is a DRAFT for physician review and must be validated by a licensed physician before activation.\n\n");

        // 1. PATIENT INFORMATION
        sb.append("=== PATIENT INFORMATION ===\n");
        sb.append("Patient ID: ").append(patient != null ? patient.patientId() : "N/A").append("\n");
        if (patient != null) {
            sb.append("Name: ").append(patient.firstName() != null ? patient.firstName() : "").append(" ").append(patient.lastName() != null ? patient.lastName() : "").append("\n");
            sb.append("Age: ").append(patient.age() != null ? patient.age() : (twin != null && twin.age() != null ? twin.age() : "N/A")).append("\n");
            sb.append("Gender: ").append(patient.gender() != null ? patient.gender() : "N/A").append("\n");
            if (patient.condition() != null && !patient.condition().isBlank()) sb.append("Primary Condition: ").append(patient.condition()).append("\n");
            if (patient.assignedDoctorName() != null && !patient.assignedDoctorName().isBlank()) sb.append("Attending Doctor: ").append(patient.assignedDoctorName()).append("\n");
        } else {
            sb.append("Demographics: Age ").append(twin != null && twin.age() != null ? twin.age() : "35").append(", Gender ").append(twin != null && twin.gender() != null ? twin.gender() : "Male").append("\n");
        }
        sb.append("\n");

        // 2. CURRENT VITALS
        sb.append("=== LATEST RECORDED VITALS ===\n");
        if (vitals != null) {
            sb.append("Heart Rate: ").append(vitals.heartRate() != null ? vitals.heartRate() + " BPM" : "N/A").append("\n");
            sb.append("Blood Pressure: ").append(vitals.bpSystolic() != null ? vitals.bpSystolic() : (twin != null ? twin.systolicBP() : "N/A"))
                    .append("/").append(vitals.bpDiastolic() != null ? vitals.bpDiastolic() : (twin != null ? twin.diastolicBP() : "N/A")).append(" mmHg\n");
            sb.append("SpO2 (Oxygen Saturation): ").append(vitals.spo2() != null ? vitals.spo2() + "%" : (twin != null && twin.oxygen() != null ? twin.oxygen() + "%" : "N/A")).append("\n");
            sb.append("Body Temperature: ").append(vitals.temperature() != null ? vitals.temperature() + " °C" : (twin != null && twin.temperature() != null ? twin.temperature() + " °C" : "N/A")).append("\n");
            sb.append("Recorded Timestamp: ").append(vitals.recordedAt() != null ? vitals.recordedAt().toString() : "Recent").append("\n");
        } else if (twin != null) {
            sb.append("Heart Rate: ").append(twin.heartRate() != null ? twin.heartRate() + " BPM" : "N/A").append("\n");
            sb.append("Blood Pressure: ").append(twin.systolicBP() != null ? twin.systolicBP() : "N/A").append("/").append(twin.diastolicBP() != null ? twin.diastolicBP() : "N/A").append(" mmHg\n");
            sb.append("SpO2: ").append(twin.oxygen() != null ? twin.oxygen() + "%" : "N/A").append("\n");
            sb.append("Body Temperature: ").append(twin.temperature() != null ? twin.temperature() + " °C" : "N/A").append("\n");
            sb.append("Recorded Timestamp: Latest available snapshot\n");
        } else {
            sb.append("Live vitals status: CURRENT VITALS UNAVAILABLE IN SYSTEM. Base care plan strictly on baseline risk profile without inventing vital measurements.\n");
        }
        sb.append("\n");

        // 3. HEALTH TWIN & LAB METRICS
        if (twin != null) {
            sb.append("=== HEALTH TWIN & CLINICAL LAB METRICS ===\n");
            if (twin.height() != null) sb.append("Height: ").append(twin.height()).append(" cm, ");
            if (twin.weight() != null) sb.append("Weight: ").append(twin.weight()).append(" kg, ");
            if (twin.bmi() != null) sb.append("BMI: ").append(twin.bmi()).append("\n");
            if (twin.bloodGlucose() != null) sb.append("Blood Glucose: ").append(twin.bloodGlucose()).append(" mg/dL, ");
            if (twin.hbA1c() != null) sb.append("HbA1c: ").append(twin.hbA1c()).append("%, ");
            if (twin.cholesterol() != null) sb.append("Cholesterol: ").append(twin.cholesterol()).append(" mg/dL\n");
            sb.append("Smoking History: ").append(twin.smokingHistory() != null ? twin.smokingHistory() : "No").append(", ");
            sb.append("Family History: ").append(twin.familyHistory() != null ? twin.familyHistory() : "No").append("\n\n");
        }

        // 4. RISK PREDICTION
        sb.append("=== AI RISK PREDICTION & FACTORS ===\n");
        if (flaskResponse != null && "SUCCESS".equalsIgnoreCase(flaskResponse.status())) {
            sb.append("Heart Disease AI Assessment: ").append(flaskResponse.heartDisease()).append("\n");
            sb.append("Diabetes AI Assessment: ").append(flaskResponse.diabetes()).append("\n");
        }
        sb.append("Assigned Clinical Risk Level: ").append(defaultRisk != null ? defaultRisk : "MODERATE").append("\n\n");

        // 5. CAREPLAN HISTORY & ADHERENCE
        if (previousCarePlans != null && !previousCarePlans.isEmpty()) {
            CarePlan prev = previousCarePlans.get(0);
            sb.append("=== PREVIOUS CAREPLAN HISTORY ===\n");
            sb.append("Previous Plan ID: ").append(prev.getCarePlanId()).append("\n");
            sb.append("Previous Risk Level: ").append(prev.getRiskLevel() != null ? prev.getRiskLevel() : prev.getPredictionRisk()).append("\n");
            sb.append("Previous Goal: ").append(prev.getGoal()).append("\n");
            sb.append("Previous Adherence Rate: ").append(prev.getAdherence() != null ? prev.getAdherence() + "%" : "N/A").append("\n\n");
        }

        // 6. OUTPUT FORMAT REQUIREMENTS
        sb.append("=== DESIRED OUTPUT SCHEMA ===\n");
        sb.append("Return ONLY a raw valid JSON object with NO markdown codeblock formatting, matching this exact schema:\n");
        sb.append("{\n");
        sb.append("  \"riskLevel\": \"HIGH\" | \"MODERATE\" | \"LOW\",\n");
        sb.append("  \"goal\": \"Specific, measurable clinical care goal tailored to patient risk & vitals\",\n");
        sb.append("  \"clinicalSummary\": \"Comprehensive clinical summary narrative highlighting patient measurements, identified vitals abnormalities, and medical justification for recommendations\",\n");
        sb.append("  \"medications\": [\"Medication 1 name with dosage, frequency, and administration instructions\", \"Medication 2 name with dosage\"],\n");
        sb.append("  \"diet\": [\"Dietary recommendation 1 tailored to patient profile\", \"Dietary recommendation 2\"],\n");
        sb.append("  \"exercise\": [\"Exercise recommendation 1 considering patient risk and joint/cardiovascular tolerance\", \"Exercise recommendation 2\"],\n");
        sb.append("  \"sleepRecommendation\": \"Sleep duration and hygiene advice e.g. 7-8 Hours restful sleep nightly\",\n");
        sb.append("  \"waterIntake\": \"Daily water intake recommendation e.g. 2.5 - 3.0 Litres daily\",\n");
        sb.append("  \"lifestyleAdvice\": [\"Lifestyle recommendation 1\", \"Lifestyle recommendation 2\"],\n");
        sb.append("  \"monitoringRecommendations\": [\"Specific vitals monitoring protocol e.g. Check Blood Pressure twice daily before meals\"],\n");
        sb.append("  \"warningSigns\": [\"Critical red-flag symptom 1 requiring emergency attention e.g. Chest pain\", \"Red-flag symptom 2\"],\n");
        sb.append("  \"reviewIntervalDays\": 30\n");
        sb.append("}\n");

        return sb.toString();
    }

    private CarePlanRecommendationResult parseGeminiResponse(String jsonResponseBody, String defaultRisk) {
        try {
            com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(jsonResponseBody);
            com.fasterxml.jackson.databind.JsonNode candidates = root.get("candidates");
            if (candidates == null || !candidates.isArray() || candidates.isEmpty()) {
                logger.warn("No candidates returned from Gemini API");
                return null;
            }

            com.fasterxml.jackson.databind.JsonNode content = candidates.get(0).get("content");
            if (content == null || !content.has("parts")) {
                return null;
            }

            String text = content.get("parts").get(0).get("text").asText().trim();
            if (text.startsWith("```")) {
                text = text.replaceAll("^```json", "").replaceAll("^```", "").replaceAll("```$", "").trim();
            }

            Map<String, Object> map = objectMapper.readValue(text, new TypeReference<Map<String, Object>>() {});

            String riskLevel = map.get("riskLevel") != null ? map.get("riskLevel").toString().toUpperCase() : (defaultRisk != null ? defaultRisk : "MODERATE");
            String goal = map.get("goal") != null ? map.get("goal").toString() : "Personalized Clinical Care & Risk Reduction Goal";
            String clinicalSummary = map.get("clinicalSummary") != null ? map.get("clinicalSummary").toString() :
                    (map.get("aiRecommendation") != null ? map.get("aiRecommendation").toString() : "Gemini AI clinical draft generated for physician review.");

            List<String> medications = parseStringList(map.get("medications"));
            if (medications.isEmpty()) {
                medications = List.of("Clinical decision support draft — physician to prescribe as indicated");
            }

            String diet = formatListOrString(map.get("diet"), "Healthy Balanced Clinical Diet tailored to patient risk");
            String exercise = formatListOrString(map.get("exercise"), "30 mins moderate physical activity daily");
            String sleep = map.get("sleepRecommendation") != null ? map.get("sleepRecommendation").toString() : "7-8 Hours restful sleep nightly";
            String water = map.get("waterIntake") != null ? map.get("waterIntake").toString() : "2.5 Litres daily";
            Integer reviewDays = map.get("reviewIntervalDays") instanceof Number num ? num.intValue() : 30;

            String lifestyle = formatListOrString(map.get("lifestyleAdvice"), "Maintain regular daily vitals logging and healthy lifestyle routines");
            List<String> monitoringRecs = parseStringList(map.get("monitoringRecommendations"));
            if (monitoringRecs.isEmpty()) {
                monitoringRecs = List.of("Log Blood Pressure and Heart Rate daily", "Track daily activity and sleep duration");
            }

            List<String> warningSigns = parseStringList(map.get("warningSigns"));
            if (warningSigns.isEmpty()) {
                warningSigns = List.of("Chest pain or tightness", "Severe shortness of breath", "SpO2 drop below 92%", "Sudden dizziness or fainting");
            }

            String doctorNotes = "Gemini AI generated clinical decision-support draft. Requires physician review and approval.";

            logger.info("Successfully parsed Gemini AI CarePlan recommendations (Risk: {})", riskLevel);

            return new CarePlanRecommendationResult(
                    riskLevel,
                    goal,
                    clinicalSummary,
                    medications,
                    diet,
                    exercise,
                    sleep,
                    water,
                    reviewDays,
                    lifestyle,
                    monitoringRecs,
                    warningSigns,
                    doctorNotes,
                    clinicalSummary,
                    "GEMINI_1.5_FLASH"
            );

        } catch (Exception e) {
            logger.error("Failed to parse Gemini response text: {}", e.getMessage(), e);
            return null;
        }
    }

    private List<String> parseStringList(Object obj) {
        if (obj instanceof List<?> list) {
            return list.stream().map(Object::toString).toList();
        } else if (obj instanceof String s && !s.isBlank()) {
            return List.of(s);
        }
        return new ArrayList<>();
    }

    private String formatListOrString(Object obj, String defaultValue) {
        if (obj instanceof List<?> list) {
            return String.join("; ", list.stream().map(Object::toString).toList());
        } else if (obj != null && !obj.toString().isBlank()) {
            return obj.toString();
        }
        return defaultValue;
    }
}
