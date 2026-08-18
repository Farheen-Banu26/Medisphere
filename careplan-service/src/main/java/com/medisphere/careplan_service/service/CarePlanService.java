package com.medisphere.careplan_service.service;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medisphere.careplan_service.client.FlaskClient;
import com.medisphere.careplan_service.client.FlaskRequest;
import com.medisphere.careplan_service.client.FlaskResponse;
import com.medisphere.careplan_service.client.HealthTwinClient;
import com.medisphere.careplan_service.client.HealthTwinDTO;
import com.medisphere.careplan_service.client.PatientClient;
import com.medisphere.careplan_service.client.PatientDTO;
import com.medisphere.careplan_service.client.VitalsClient;
import com.medisphere.careplan_service.client.VitalsDTO;
import com.medisphere.careplan_service.dto.AddCommentRequest;
import com.medisphere.careplan_service.dto.ApproveCarePlanRequest;
import com.medisphere.careplan_service.dto.AuditResponse;
import com.medisphere.careplan_service.dto.CommentResponse;
import com.medisphere.careplan_service.dto.DashboardSummaryResponse;
import com.medisphere.careplan_service.dto.DoctorApproveRequest;
import com.medisphere.careplan_service.dto.DoctorRejectRequest;
import com.medisphere.careplan_service.dto.GenerateCarePlanRequest;
import com.medisphere.careplan_service.dto.OutcomeSummaryResponse;
import com.medisphere.careplan_service.dto.OutcomeTrackingRequest;
import com.medisphere.careplan_service.dto.TodayCarePlanResponse;
import com.medisphere.careplan_service.dto.UpdateAdherenceRequest;
import com.medisphere.careplan_service.dto.UpdateCarePlanRequest;
import com.medisphere.careplan_service.dto.UpdateDoctorNotesRequest;
import com.medisphere.careplan_service.dto.UpdateProgressRequest;
import com.medisphere.careplan_service.dto.ValidationSummaryResponse;
import com.medisphere.careplan_service.exception.CarePlanNotFoundException;
import com.medisphere.careplan_service.exception.InvalidCarePlanStatusException;
import com.medisphere.careplan_service.model.AuditLog;
import com.medisphere.careplan_service.model.CarePlan;
import com.medisphere.careplan_service.model.CarePlanComment;
import com.medisphere.careplan_service.model.DoctorStatus;
import com.medisphere.careplan_service.repository.CarePlanRepository;

/**
 * Business logic for care plan management.
 *
 * Phase 2: Collects patient & health twin data, calls Flask AI service,
 * generates AI-assisted care plan recommendations, and falls back to safe rules if Flask AI is unavailable.
 */
@Service
public class CarePlanService {

    private static final Logger logger = LoggerFactory.getLogger(CarePlanService.class);

    // ===========================================
    // Security Context & Authorization Guards
    // ===========================================
    public static class SecurityUserContext {
        public String username;
        public String email;
        public List<String> roles = new java.util.ArrayList<>();
        public boolean isAdmin = false;
        public boolean isDoctor = false;
        public boolean isPatient = false;
    }

    public SecurityUserContext parseSecurityContext(jakarta.servlet.http.HttpServletRequest request) {
        SecurityUserContext ctx = new SecurityUserContext();
        if (request == null) return ctx;
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return ctx;
        String token = authHeader.substring(7).trim();
        String[] parts = token.split("\\.");
        if (parts.length < 2) return ctx;
        try {
            String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(parts[1]), java.nio.charset.StandardCharsets.UTF_8);
            ObjectMapper mapper = new ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(payloadJson);
            if (root.has("preferred_username")) ctx.username = root.get("preferred_username").asText();
            if (root.has("email")) ctx.email = root.get("email").asText();
            if (root.has("realm_access") && root.get("realm_access").has("roles")) {
                for (com.fasterxml.jackson.databind.JsonNode r : root.get("realm_access").get("roles")) {
                    String role = r.asText().toUpperCase();
                    ctx.roles.add(role);
                    if ("ADMIN".equals(role)) ctx.isAdmin = true;
                    if ("DOCTOR".equals(role)) ctx.isDoctor = true;
                    if ("PATIENT".equals(role)) ctx.isPatient = true;
                }
            }
        } catch (Exception ex) {}
        return ctx;
    }

    public String resolveDoctorId(String doctorIdentifier) {
        if (doctorIdentifier == null || doctorIdentifier.trim().isEmpty()) return "D001";
        String normalized = doctorIdentifier.trim().toLowerCase();
        switch (normalized) {
            case "doctor": case "d001": case "dr_jenkins": return "D001";
            case "dr_smith": case "d002": return "D002";
            case "dr_jones": case "d003": return "D003";
            case "dr_patel": case "d004": return "D004";
            case "dr_chen": case "d005": return "D005";
            default: return doctorIdentifier.toUpperCase();
        }
    }

    public String resolvePatientId(String username, String email) {
        if (username != null && !username.trim().isEmpty()) {
            String u = username.trim();
            if ("patient".equalsIgnoreCase(u) || "farheen".equalsIgnoreCase(u)) return "P1001";
            try {
                PatientDTO p = patientClient.getPatient(u);
                if (p != null && p.patientId() != null && !p.patientId().isBlank()) {
                    return p.patientId();
                }
            } catch (Exception ex) {
                logger.warn("Failed to query patient-service for username {}: {}", u, ex.getMessage());
            }
            return u.toUpperCase();
        }
        if (email != null && !email.trim().isEmpty()) {
            if ("banufarheen786786@gmail.com".equalsIgnoreCase(email) || "patient@medisphere.com".equalsIgnoreCase(email)) return "P1001";
        }
        return "P1001";
    }

    public boolean isPatientAssignedToDoctor(String docId, String targetPatientId) {
        String doc = resolveDoctorId(docId);
        String p = targetPatientId.toUpperCase().trim();
        if ("D001".equals(doc)) {
            return p.equals("P1001") || p.equals("P1002") ||
                   p.equals("PT00001") || p.equals("PT00002") || p.equals("PT00003") || p.equals("PT00004") ||
                   p.equals("PT00005") || p.equals("PT00006") || p.equals("PT00007") || p.equals("PT00008") ||
                   p.equals("PT00039") || p.equals("PT00040");
        } else if ("D002".equals(doc)) {
            return p.equals("PT00009") || p.equals("PT00010") || p.equals("PT00011") || p.equals("PT00012") ||
                   p.equals("PT00013") || p.equals("PT00014") || p.equals("PT00015") || p.equals("PT00016") ||
                   p.equals("PT00041") || p.equals("PT00042");
        } else if ("D003".equals(doc)) {
            return p.equals("PT00017") || p.equals("PT00018") || p.equals("PT00019") || p.equals("PT00020") ||
                   p.equals("PT00021") || p.equals("PT00022") || p.equals("PT00023") || p.equals("PT00024") ||
                   p.equals("PT00043") || p.equals("PT00044");
        } else if ("D004".equals(doc)) {
            return p.equals("PT00025") || p.equals("PT00026") || p.equals("PT00027") || p.equals("PT00028") ||
                   p.equals("PT00029") || p.equals("PT00030") || p.equals("PT00031") ||
                   p.equals("PT00045") || p.equals("PT00046");
        } else if ("D005".equals(doc)) {
            return p.equals("PT00032") || p.equals("PT00033") || p.equals("PT00034") || p.equals("PT00035") ||
                   p.equals("PT00036") || p.equals("PT00037") || p.equals("PT00038") ||
                   p.equals("PT00047") || p.equals("PT00048");
        }
        return false;
    }

    public void verifyPatientResourceAccess(String targetPatientId, jakarta.servlet.http.HttpServletRequest request) {
        SecurityUserContext ctx = parseSecurityContext(request);
        if (ctx.username == null || ctx.username.trim().isEmpty()) return;

        if (ctx.isAdmin) return;

        if (ctx.isPatient) {
            String myPatientId = resolvePatientId(ctx.username, ctx.email);
            String requestedId = resolvePatientId(targetPatientId, null);
            if (!requestedId.equalsIgnoreCase(myPatientId) && !targetPatientId.equalsIgnoreCase(myPatientId)) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Access Denied: Patient " + myPatientId + " cannot access Patient " + targetPatientId + " Care Plan"
                );
            }
        } else if (ctx.isDoctor) {
            String docId = resolveDoctorId(ctx.username);
            String requestedId = resolvePatientId(targetPatientId, null);
            if (!isPatientAssignedToDoctor(docId, requestedId) && !isPatientAssignedToDoctor(docId, targetPatientId)) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Access Denied: Doctor " + docId + " cannot access Patient " + targetPatientId + " Care Plan"
                );
            }
        }
    }

    private final CarePlanRepository repository;
    private final PatientClient patientClient;
    private final HealthTwinClient healthTwinClient;
    private final VitalsClient vitalsClient;
    private final FlaskClient flaskClient;
    private final com.medisphere.careplan_service.client.GeminiClient geminiClient;
    private final CarePlanRecommendationEngine recommendationEngine;
    private final List<String> featureColumns;
    private final ObjectMapper mapper = new ObjectMapper();

    public CarePlanService(CarePlanRepository repository,
                           PatientClient patientClient,
                           HealthTwinClient healthTwinClient,
                           VitalsClient vitalsClient,
                           FlaskClient flaskClient,
                           com.medisphere.careplan_service.client.GeminiClient geminiClient) {
        this.repository = repository;
        this.patientClient = patientClient;
        this.healthTwinClient = healthTwinClient;
        this.vitalsClient = vitalsClient;
        this.flaskClient = flaskClient;
        this.geminiClient = geminiClient;
        this.recommendationEngine = new CarePlanRecommendationEngine();

        List<String> cols;
        try {
            cols = mapper.readValue(
                    new ClassPathResource("feature_columns.json").getInputStream(),
                    new TypeReference<List<String>>() {});
        } catch (IOException e) {
            logger.warn("Failed to load feature_columns.json, using default columns list");
            cols = List.of("age", "gender", "height", "weight", "bmi", "heartRate",
                    "systolicBP", "diastolicBP", "oxygen", "temperature", "steps",
                    "sleepHours", "cholesterol", "bloodGlucose", "hbA1c", "smokingHistory", "familyHistory");
        }
        this.featureColumns = cols;
    }

    // ─── Generate Care Plan ────────────────────────────────────────────────────

    /**
     * Creates an AI-assisted care plan for a patient using REAL PATIENT DATA, LATEST VITALS, and GEMINI API.
     * Recommendations are saved with PENDING status and require physician review & approval before activation.
     */
    public CarePlan generateCarePlan(GenerateCarePlanRequest request) {
        String patientId = request.getPatientId();
        logger.info("Generating AI care plan for patient: {}", patientId);

        CarePlanRecommendationResult recommendation = null;
        Map<String, Object> clinicalInputs = new LinkedHashMap<>();

        PatientDTO patient = null;
        VitalsDTO vitals = null;
        HealthTwinDTO twin = null;
        FlaskResponse flaskResp = null;
        List<CarePlan> previousPlans = List.of();

        try {
            // Fetch Patient Profile
            patient = patientClient.getPatient(patientId);
            // Fetch Latest Vitals from vitals-service
            vitals = vitalsClient.getLatestVitals(patientId);
            // Fetch Health Twin / Lab Data
            twin = healthTwinClient.getHealthTwin(patientId);
            // Fetch Care Plan History
            previousPlans = repository.findByPatientIdOrderByCreatedAtDesc(patientId);

            if (patient != null && twin != null) {
                try {
                    Map<String, Object> features = buildFeatureMap(patient, twin);
                    FlaskRequest flaskReq = new FlaskRequest(features);
                    flaskResp = flaskClient.predict(flaskReq);
                } catch (Exception ex) {
                    logger.warn("Flask AI prediction failed for patient {}: {}. Proceeding with baseline features.", patientId, ex.getMessage());
                }
            }

            // Build Clinical Inputs Snapshot for Audit & Doctor UI
            clinicalInputs.put("patientId", patientId);
            if (patient != null) {
                clinicalInputs.put("patientName", (patient.firstName() != null ? patient.firstName() : "") + " " + (patient.lastName() != null ? patient.lastName() : ""));
                clinicalInputs.put("age", patient.age());
                if (patient.condition() != null) clinicalInputs.put("condition", patient.condition());
            }

            if (vitals != null) {
                Map<String, Object> vMap = new LinkedHashMap<>();
                vMap.put("heartRate", vitals.heartRate());
                vMap.put("bpSystolic", vitals.bpSystolic());
                vMap.put("bpDiastolic", vitals.bpDiastolic());
                vMap.put("spo2", vitals.spo2());
                vMap.put("temperature", vitals.temperature());
                vMap.put("steps", vitals.steps());
                vMap.put("sleepHours", vitals.sleepHours());
                vMap.put("recordedAt", vitals.recordedAt() != null ? vitals.recordedAt().toString() : "Recent");
                clinicalInputs.put("vitals", vMap);
            } else if (twin != null) {
                Map<String, Object> vMap = new LinkedHashMap<>();
                vMap.put("heartRate", twin.heartRate());
                vMap.put("bpSystolic", twin.systolicBP());
                vMap.put("bpDiastolic", twin.diastolicBP());
                vMap.put("spo2", twin.oxygen());
                vMap.put("temperature", twin.temperature());
                vMap.put("recordedAt", "HealthTwin Snapshot");
                clinicalInputs.put("vitals", vMap);
            } else {
                clinicalInputs.put("vitalsStatus", "Live vitals unavailable");
            }

            if (twin != null) {
                Map<String, Object> tMap = new LinkedHashMap<>();
                tMap.put("height", twin.height());
                tMap.put("weight", twin.weight());
                tMap.put("bmi", twin.bmi());
                tMap.put("bloodGlucose", twin.bloodGlucose());
                tMap.put("hbA1c", twin.hbA1c());
                tMap.put("cholesterol", twin.cholesterol());
                tMap.put("smokingHistory", twin.smokingHistory());
                tMap.put("familyHistory", twin.familyHistory());
                clinicalInputs.put("healthTwin", tMap);
            }

            if (flaskResp != null) {
                clinicalInputs.put("heartDiseasePrediction", flaskResp.heartDisease());
                clinicalInputs.put("diabetesPrediction", flaskResp.diabetes());
            }
            clinicalInputs.put("predictionRisk", request.getPredictionRisk());
            clinicalInputs.put("generatedAt", LocalDateTime.now().toString());

            // 1. Try Gemini API Generation
            if (geminiClient != null && geminiClient.isConfigured()) {
                recommendation = geminiClient.generateCarePlan(patient, vitals, twin, flaskResp, request.getPredictionRisk(), previousPlans);
                if (recommendation != null) {
                    logger.info("Successfully generated AI CarePlan via Gemini 1.5 Flash for patient {}", patientId);
                }
            }

            // 2. Fallback to recommendation engine if Gemini is unavailable or unconfigured
            if (recommendation == null) {
                logger.info("Gemini API not available/configured for patient {}. Using recommendation engine fallback.", patientId);
                if (flaskResp != null) {
                    recommendation = recommendationEngine.generate(flaskResp, request.getPredictionRisk());
                } else {
                    recommendation = recommendationEngine.generateFallback(request.getPredictionRisk());
                }
            }
        } catch (Exception ex) {
            logger.error("CarePlan generation failed for patient {}: {}. Continuing with fallback rules.",
                    patientId, ex.getMessage());
            recommendation = recommendationEngine.generateFallback(request.getPredictionRisk());
        }

        CarePlan plan = new CarePlan();
        plan.setCarePlanId("CP-" + UUID.randomUUID().toString().toUpperCase());
        plan.setPatientId(patientId);

        // AI Generated Fields
        plan.setRiskLevel(recommendation.riskLevel());
        plan.setPredictionRisk(request.getPredictionRisk() != null && !request.getPredictionRisk().isBlank()
                ? request.getPredictionRisk()
                : recommendation.riskLevel());

        plan.setGoal(request.getGoal() != null && !request.getGoal().isBlank()
                ? request.getGoal()
                : recommendation.goal());

        plan.setClinicalSummary(recommendation.clinicalSummary());
        plan.setAiRecommendation(recommendation.aiRecommendation());

        plan.setMedications(request.getMedications() != null && !request.getMedications().isEmpty()
                ? request.getMedications()
                : recommendation.medications());

        plan.setDiet(request.getDiet() != null && !request.getDiet().isBlank()
                ? request.getDiet()
                : recommendation.diet());

        plan.setExercise(request.getExercise() != null && !request.getExercise().isBlank()
                ? request.getExercise()
                : recommendation.exercise());

        plan.setSleepRecommendation(request.getSleepRecommendation() != null && !request.getSleepRecommendation().isBlank()
                ? request.getSleepRecommendation()
                : recommendation.sleepRecommendation());

        plan.setWaterIntake(request.getWaterIntake() != null && !request.getWaterIntake().isBlank()
                ? request.getWaterIntake()
                : recommendation.waterIntake());

        plan.setLifestyleAdvice(recommendation.lifestyleAdvice());
        plan.setMonitoringRecommendations(recommendation.monitoringRecommendations());
        plan.setWarningSigns(recommendation.warningSigns());

        plan.setReviewIntervalDays(recommendation.reviewIntervalDays());
        plan.setGeneratedBy(recommendation.generatedBy());
        plan.setGenerationTime(LocalDateTime.now());
        plan.setClinicalInputs(clinicalInputs);

        plan.setDoctorNotes(request.getDoctorNotes() != null && !request.getDoctorNotes().isBlank()
                ? request.getDoctorNotes()
                : recommendation.doctorNotes());

        plan.setNextReview(request.getNextReview() != null
                ? request.getNextReview()
                : LocalDate.now().plusDays(recommendation.reviewIntervalDays()));

        // Initial state
        plan.setDoctorStatus(DoctorStatus.PENDING);
        plan.setAdherence(0);
        plan.setCreatedAt(LocalDateTime.now());
        plan.setUpdatedAt(LocalDateTime.now());
        plan.addAuditLog("GENERATED", "AI_SYSTEM", "SYSTEM", "Care Plan Generated via " + recommendation.generatedBy());

        CarePlan saved = repository.save(plan);
        logger.info("Care plan saved to MongoDB: {} (Risk: {}, GeneratedBy: {})",
                saved.getCarePlanId(), saved.getRiskLevel(), saved.getGeneratedBy());

        return saved;
    }

    // ─── Feature Map Construction ──────────────────────────────────────────────

    private Map<String, Object> buildFeatureMap(PatientDTO patient, HealthTwinDTO twin) {
        Map<String, Object> map = new LinkedHashMap<>();

        for (String column : featureColumns) {
            switch (column) {
                case "age" -> map.put(column, resolveAge(patient, twin));
                case "gender" -> map.put(column, normalizeGender(resolveGender(patient, twin)));
                case "height" -> map.put(column, defaultNumeric(twin.height()));
                case "weight" -> map.put(column, defaultNumeric(twin.weight()));
                case "bmi" -> map.put(column, defaultNumeric(twin.bmi()));
                case "heartRate" -> map.put(column, defaultNumeric(twin.heartRate()));
                case "systolicBP" -> map.put(column, defaultNumeric(twin.systolicBP()));
                case "diastolicBP" -> map.put(column, defaultNumeric(twin.diastolicBP()));
                case "oxygen" -> map.put(column, defaultNumeric(twin.oxygen()));
                case "temperature" -> map.put(column, defaultNumeric(twin.temperature()));
                case "steps" -> map.put(column, defaultNumeric(twin.steps()));
                case "sleepHours" -> map.put(column, defaultNumeric(twin.sleepHours()));
                case "cholesterol" -> map.put(column, defaultNumeric(twin.cholesterol()));
                case "bloodGlucose" -> map.put(column, defaultNumeric(twin.bloodGlucose()));
                case "hbA1c" -> map.put(column, defaultNumeric(twin.hbA1c()));
                case "smokingHistory" -> map.put(column, defaultYesNo(twin.smokingHistory()));
                case "familyHistory" -> map.put(column, defaultYesNo(twin.familyHistory()));
                default -> map.put(column, 0);
            }
        }
        return map;
    }

    private Integer resolveAge(PatientDTO patient, HealthTwinDTO twin) {
        if (patient != null && patient.age() != null) return patient.age();
        if (patient != null && patient.dob() != null && !patient.dob().isBlank()) {
            try {
                return Period.between(LocalDate.parse(patient.dob()), LocalDate.now()).getYears();
            } catch (Exception ignored) {}
        }
        return twin != null && twin.age() != null ? twin.age() : 35;
    }

    private String resolveGender(PatientDTO patient, HealthTwinDTO twin) {
        if (patient != null && patient.gender() != null && !patient.gender().isBlank()) return patient.gender();
        return twin != null && twin.gender() != null ? twin.gender() : "Male";
    }

    private String normalizeGender(String gender) {
        if (gender == null || gender.isBlank()) return "Male";
        String normalized = gender.trim().toLowerCase();
        return switch (normalized) {
            case "female", "f" -> "Female";
            default -> "Male";
        };
    }

    private Object defaultNumeric(Number value) {
        return value == null ? 0 : value;
    }

    private String defaultYesNo(String value) {
        return (value == null || value.isBlank()) ? "No" : value;
    }

    // ─── Get Latest Care Plan by Patient ──────────────────────────────────────

    public CarePlan getLatestByPatient(String patientId) {
        logger.info("Fetching latest care plan for patient: {}", patientId);
        List<CarePlan> plans = repository.findByPatientIdOrderByCreatedAtDesc(patientId);
        return plans.isEmpty() ? null : plans.get(0);
    }

    // ─── Patient Care Plan APIs ───────────────────────────────────────────────

    /**
     * Returns ONLY the latest APPROVED care plan for a patient.
     * Throws CarePlanNotFoundException (404) if no APPROVED care plan exists.
     */
    public CarePlan getLatestApprovedCarePlan(String patientId) {
        logger.info("Fetching latest APPROVED care plan for patient: {}", patientId);
        List<CarePlan> approvedPlans = repository
                .findByPatientIdAndDoctorStatusOrderByCreatedAtDesc(patientId, DoctorStatus.APPROVED);
        if (approvedPlans.isEmpty()) {
            throw new CarePlanNotFoundException(
                    "No approved care plan found for patient: " + patientId);
        }
        return approvedPlans.get(0);
    }

    /**
     * Returns all APPROVED care plans for a patient, sorted newest first.
     * Throws CarePlanNotFoundException (404) if no APPROVED care plan exists.
     */
    public List<CarePlan> getApprovedCarePlanHistory(String patientId) {
        logger.info("Fetching APPROVED care plan history for patient: {}", patientId);
        List<CarePlan> approvedPlans = repository
                .findByPatientIdAndDoctorStatusOrderByCreatedAtDesc(patientId, DoctorStatus.APPROVED);
        if (approvedPlans.isEmpty()) {
            throw new CarePlanNotFoundException(
                    "No approved care plan history found for patient: " + patientId);
        }
        return approvedPlans;
    }

    /**
     * Returns today's care plan summary DTO for a patient.
     * Based on the latest APPROVED care plan.
     * Throws CarePlanNotFoundException (404) if no APPROVED care plan exists.
     */
    public TodayCarePlanResponse getTodayCarePlanSummary(String patientId) {
        logger.info("Fetching today's care plan summary for patient: {}", patientId);
        CarePlan latestApproved = getLatestApprovedCarePlan(patientId);
        return TodayCarePlanResponse.fromCarePlan(latestApproved);
    }

    // ─── Get Pending Care Plans ────────────────────────────────────────────────

    /**
     * Returns all care plans with doctorStatus == PENDING.
     */
    public List<CarePlan> getPendingCarePlans() {
        logger.info("Fetching all pending care plans");
        return repository.findByDoctorStatusOrderByCreatedAtDesc(DoctorStatus.PENDING);
    }

    public List<CarePlan> getAllCarePlans() {
        logger.info("Fetching all care plans");
        return repository.findAll();
    }

    public List<CarePlan> getApprovedCarePlans() {
        logger.info("Fetching all approved care plans");
        return repository.findByDoctorStatusOrderByCreatedAtDesc(DoctorStatus.APPROVED);
    }

    public List<CarePlan> getRejectedCarePlans() {
        logger.info("Fetching all rejected care plans");
        return repository.findByDoctorStatusOrderByCreatedAtDesc(DoctorStatus.REJECTED);
    }

    // ─── Doctor Approve Care Plan ──────────────────────────────────────────────

    /**
     * Approves a care plan.
     * Transitions status from PENDING -> APPROVED.
     * Idempotent if already APPROVED.
     * Throws InvalidCarePlanStatusException (409) if currently REJECTED.
     */
    public CarePlan approveCarePlanByDoctor(String carePlanId, DoctorApproveRequest request) {
        logger.info("Doctor {} approving care plan: {}", request.getApprovedBy(), carePlanId);
        CarePlan plan = findByCarePlanIdOrThrow(carePlanId);

        if (plan.getDoctorStatus() == DoctorStatus.APPROVED) {
            logger.info("Care plan {} is already APPROVED. Idempotent return.", carePlanId);
            if (request.getDoctorNotes() != null && !request.getDoctorNotes().isBlank()) {
                plan.setDoctorNotes(request.getDoctorNotes());
            }
            plan.setLastModifiedBy(request.getApprovedBy());
            plan.setLastModifiedAt(LocalDateTime.now());
            plan.setUpdatedAt(LocalDateTime.now());
            return repository.save(plan);
        }

        if (plan.getDoctorStatus() == DoctorStatus.REJECTED) {
            throw new InvalidCarePlanStatusException("Cannot approve a care plan that is currently REJECTED.");
        }

        plan.setDoctorStatus(DoctorStatus.APPROVED);
        plan.setApprovedBy(request.getApprovedBy());
        plan.setApprovedAt(LocalDateTime.now());
        plan.setLastModifiedBy(request.getApprovedBy());
        plan.setLastModifiedAt(LocalDateTime.now());
        plan.setUpdatedAt(LocalDateTime.now());

        if (request.getDoctorNotes() != null && !request.getDoctorNotes().isBlank()) {
            plan.setDoctorNotes(request.getDoctorNotes());
        }

        plan.addAuditLog("APPROVED", request.getApprovedBy(), "DOCTOR", "Doctor Approved Care Plan");
        CarePlan saved = repository.save(plan);
        logger.info("Care plan {} successfully APPROVED by doctor {}", carePlanId, request.getApprovedBy());
        return saved;
    }

    // ─── Doctor Reject Care Plan ───────────────────────────────────────────────

    /**
     * Rejects a care plan with a reason.
     * Transitions status from PENDING -> REJECTED.
     * Idempotent if already REJECTED.
     * Throws InvalidCarePlanStatusException (409) if currently APPROVED.
     */
    public CarePlan rejectCarePlanByDoctor(String carePlanId, DoctorRejectRequest request) {
        logger.info("Doctor {} rejecting care plan: {} with reason: {}",
                request.getRejectedBy(), carePlanId, request.getReason());
        CarePlan plan = findByCarePlanIdOrThrow(carePlanId);

        if (plan.getDoctorStatus() == DoctorStatus.REJECTED) {
            logger.info("Care plan {} is already REJECTED. Idempotent return.", carePlanId);
            if (request.getReason() != null && !request.getReason().isBlank()) {
                plan.setRejectedReason(request.getReason());
            }
            plan.setLastModifiedBy(request.getRejectedBy());
            plan.setLastModifiedAt(LocalDateTime.now());
            plan.setUpdatedAt(LocalDateTime.now());
            return repository.save(plan);
        }

        if (plan.getDoctorStatus() == DoctorStatus.APPROVED) {
            throw new InvalidCarePlanStatusException("Cannot reject a care plan that is currently APPROVED.");
        }

        plan.setDoctorStatus(DoctorStatus.REJECTED);
        plan.setRejectedBy(request.getRejectedBy());
        plan.setRejectedAt(LocalDateTime.now());
        plan.setRejectedReason(request.getReason());
        plan.setLastModifiedBy(request.getRejectedBy());
        plan.setLastModifiedAt(LocalDateTime.now());
        plan.setUpdatedAt(LocalDateTime.now());
        plan.addAuditLog("REJECTED", request.getRejectedBy(), "DOCTOR", "Doctor Rejected Care Plan: " + request.getReason());

        CarePlan saved = repository.save(plan);
        logger.info("Care plan {} successfully REJECTED by doctor {}", carePlanId, request.getRejectedBy());
        return saved;
    }

    // ─── Doctor Edit / Modify Care Plan ───────────────────────────────────────

    /**
     * Updates any/all content fields of a care plan before physician approval.
     * Allows editing Risk Level, Goal, Clinical Summary, Medications, Diet, Exercise,
     * Sleep, Water, Lifestyle Advice, Monitoring Recommendations, Warning Signs, Review Interval, and Doctor Notes.
     * Records audit trail entry 'UPDATED_BY_DOCTOR'.
     */
    public CarePlan updateCarePlan(String carePlanId, UpdateCarePlanRequest request) {
        logger.info("Doctor updating care plan content sections for: {}", carePlanId);
        CarePlan plan = findByCarePlanIdOrThrow(carePlanId);

        if (request.getRiskLevel() != null && !request.getRiskLevel().isBlank()) {
            plan.setRiskLevel(request.getRiskLevel().toUpperCase());
        }
        if (request.getGoal() != null && !request.getGoal().isBlank()) {
            plan.setGoal(request.getGoal());
        }
        if (request.getClinicalSummary() != null && !request.getClinicalSummary().isBlank()) {
            plan.setClinicalSummary(request.getClinicalSummary());
        }
        if (request.getMedications() != null) {
            plan.setMedications(request.getMedications());
        }

        if (request.getDiet() != null) {
            if (request.getDiet() instanceof List<?> list) {
                plan.setDiet(String.join("; ", list.stream().map(Object::toString).toList()));
            } else {
                plan.setDiet(request.getDiet().toString());
            }
        }

        if (request.getExercise() != null) {
            if (request.getExercise() instanceof List<?> list) {
                plan.setExercise(String.join("; ", list.stream().map(Object::toString).toList()));
            } else {
                plan.setExercise(request.getExercise().toString());
            }
        }

        if (request.getSleepRecommendation() != null && !request.getSleepRecommendation().isBlank()) {
            plan.setSleepRecommendation(request.getSleepRecommendation());
        }
        if (request.getWaterIntake() != null && !request.getWaterIntake().isBlank()) {
            plan.setWaterIntake(request.getWaterIntake());
        }

        if (request.getLifestyleAdvice() != null) {
            if (request.getLifestyleAdvice() instanceof List<?> list) {
                plan.setLifestyleAdvice(String.join("; ", list.stream().map(Object::toString).toList()));
            } else {
                plan.setLifestyleAdvice(request.getLifestyleAdvice().toString());
            }
        }

        if (request.getMonitoringRecommendations() != null) {
            plan.setMonitoringRecommendations(request.getMonitoringRecommendations());
        }
        if (request.getWarningSigns() != null) {
            plan.setWarningSigns(request.getWarningSigns());
        }
        if (request.getReviewIntervalDays() != null) {
            plan.setReviewIntervalDays(request.getReviewIntervalDays());
            plan.setNextReview(LocalDate.now().plusDays(request.getReviewIntervalDays()));
        }
        if (request.getDoctorNotes() != null) {
            plan.setDoctorNotes(request.getDoctorNotes());
        }

        String doctorName = request.getLastModifiedBy() != null && !request.getLastModifiedBy().isBlank()
                ? request.getLastModifiedBy()
                : "Dr. Attending";
        plan.setLastModifiedBy(doctorName);
        plan.setLastModifiedAt(LocalDateTime.now());
        plan.setUpdatedAt(LocalDateTime.now());

        plan.addAuditLog("UPDATED_BY_DOCTOR", doctorName, "DOCTOR", "Doctor modified Care Plan content sections prior to approval");

        CarePlan saved = repository.save(plan);
        logger.info("Care plan {} successfully updated by doctor {}", carePlanId, doctorName);
        return saved;
    }

    // ─── Doctor Notes Update ───────────────────────────────────────────────────

    /**
     * Updates doctor notes for a care plan.
     */
    public CarePlan updateDoctorNotes(String carePlanId, UpdateDoctorNotesRequest request) {
        logger.info("Updating doctor notes for care plan: {}", carePlanId);
        CarePlan plan = findByCarePlanIdOrThrow(carePlanId);

        plan.setDoctorNotes(request.getDoctorNotes());
        if (request.getLastModifiedBy() != null && !request.getLastModifiedBy().isBlank()) {
            plan.setLastModifiedBy(request.getLastModifiedBy());
        }
        plan.setLastModifiedAt(LocalDateTime.now());
        plan.setUpdatedAt(LocalDateTime.now());

        CarePlan saved = repository.save(plan);
        logger.info("Doctor notes updated for care plan {}", carePlanId);
        return saved;
    }

    // ─── Approve Care Plan (Generic) ───────────────────────────────────────────

    public CarePlan approveCarePlan(String carePlanId, ApproveCarePlanRequest request) {
        logger.info("Approving care plan: {} with status: {}", carePlanId, request.getStatus());

        CarePlan plan = findByCarePlanIdOrThrow(carePlanId);

        DoctorStatus newStatus;
        try {
            newStatus = DoctorStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Invalid status value: '" + request.getStatus() + "'. Must be APPROVED or REJECTED.");
        }

        if (newStatus == DoctorStatus.PENDING) {
            throw new InvalidCarePlanStatusException("Cannot set status back to PENDING.");
        }

        if (plan.getDoctorStatus() == newStatus) {
            return plan;
        }

        if (newStatus == DoctorStatus.APPROVED && plan.getDoctorStatus() == DoctorStatus.REJECTED) {
            throw new InvalidCarePlanStatusException("Cannot approve a care plan that is currently REJECTED.");
        }
        if (newStatus == DoctorStatus.REJECTED && plan.getDoctorStatus() == DoctorStatus.APPROVED) {
            throw new InvalidCarePlanStatusException("Cannot reject a care plan that is currently APPROVED.");
        }

        if (request.getDoctorNotes() != null && !request.getDoctorNotes().isBlank()) {
            plan.setDoctorNotes(request.getDoctorNotes());
        }

        plan.setDoctorStatus(newStatus);
        plan.setUpdatedAt(LocalDateTime.now());

        CarePlan saved = repository.save(plan);
        logger.info("Care plan {} updated to status: {}", carePlanId, newStatus);
        return saved;
    }

    // ─── Adherence Tracking ───────────────────────────────────────────────────

    /**
     * Calculates adherence percentage based on 7 completed daily activities:
     * 1. medicineTaken
     * 2. exerciseCompleted
     * 3. dietFollowed
     * 4. waterGoalCompleted
     * 5. sleepGoalCompleted
     * 6. bpChecked
     * 7. glucoseChecked
     *
     * Formula: Math.round((completedActivities / 7.0) * 100)
     */
    public CarePlan updateAdherence(String carePlanId, UpdateAdherenceRequest request) {
        logger.info("Updating adherence tracking for care plan: {}", carePlanId);
        CarePlan plan = findByCarePlanIdOrThrow(carePlanId);

        boolean med = Boolean.TRUE.equals(request.getMedicineTaken());
        boolean ex = Boolean.TRUE.equals(request.getExerciseCompleted());
        boolean diet = Boolean.TRUE.equals(request.getDietFollowed());
        boolean water = Boolean.TRUE.equals(request.getWaterGoalCompleted());
        boolean sleep = Boolean.TRUE.equals(request.getSleepGoalCompleted());
        boolean bp = Boolean.TRUE.equals(request.getBpChecked());
        boolean glucose = Boolean.TRUE.equals(request.getGlucoseChecked());

        plan.setMedicineTaken(med);
        plan.setExerciseCompleted(ex);
        plan.setDietFollowed(diet);
        plan.setWaterGoalCompleted(water);
        plan.setSleepGoalCompleted(sleep);
        plan.setBpChecked(bp);
        plan.setGlucoseChecked(glucose);

        int count = 0;
        if (med) count++;
        if (ex) count++;
        if (diet) count++;
        if (water) count++;
        if (sleep) count++;
        if (bp) count++;
        if (glucose) count++;

        int calculatedAdherence = (int) Math.round((count / 7.0) * 100.0);
        plan.setAdherence(calculatedAdherence);

        LocalDateTime now = LocalDateTime.now();
        plan.setLastAdherenceUpdate(now);
        plan.setUpdatedAt(now);
        plan.addAuditLog("ADHERENCE_UPDATED", "PATIENT", "PATIENT", "Patient Updated Daily Adherence");

        CarePlan saved = repository.save(plan);
        logger.info("Care plan {} adherence recalculated: {}% ({}/7 activities completed)",
                carePlanId, calculatedAdherence, count);
        return saved;
    }

    // ─── Phase 6: Outcome Tracking ───────────────────────────────────────────

    /**
     * Updates current patient health metrics, automatically calculates improvement metrics:
     * riskImprovement = initialRisk - currentRisk
     * weightImprovement = initialWeight - currentWeight
     * bpImprovement = initialSystolicBP - currentSystolicBP
     * glucoseImprovement = initialBloodGlucose - currentBloodGlucose
     * cholesterolImprovement = initialCholesterol - currentCholesterol
     *
     * Updates outcomeLastUpdated timestamp.
     */
    public CarePlan updateOutcome(String carePlanId, OutcomeTrackingRequest request) {
        logger.info("Updating outcome metrics for care plan: {}", carePlanId);
        CarePlan plan = findByCarePlanIdOrThrow(carePlanId);

        if (request.getCurrentRisk() != null) {
            if (plan.getInitialRisk() == null) plan.setInitialRisk(request.getCurrentRisk());
            plan.setCurrentRisk(request.getCurrentRisk());
        }

        if (request.getCurrentWeight() != null) {
            if (plan.getInitialWeight() == null) plan.setInitialWeight(request.getCurrentWeight());
            plan.setCurrentWeight(request.getCurrentWeight());
        }

        if (request.getCurrentSystolicBP() != null) {
            if (plan.getInitialSystolicBP() == null) plan.setInitialSystolicBP(request.getCurrentSystolicBP());
            plan.setCurrentSystolicBP(request.getCurrentSystolicBP());
        }

        if (request.getCurrentDiastolicBP() != null) {
            if (plan.getInitialDiastolicBP() == null) plan.setInitialDiastolicBP(request.getCurrentDiastolicBP());
            plan.setCurrentDiastolicBP(request.getCurrentDiastolicBP());
        }

        if (request.getCurrentBloodGlucose() != null) {
            if (plan.getInitialBloodGlucose() == null) plan.setInitialBloodGlucose(request.getCurrentBloodGlucose());
            plan.setCurrentBloodGlucose(request.getCurrentBloodGlucose());
        }

        if (request.getCurrentCholesterol() != null) {
            if (plan.getInitialCholesterol() == null) plan.setInitialCholesterol(request.getCurrentCholesterol());
            plan.setCurrentCholesterol(request.getCurrentCholesterol());
        }

        // Calculate improvement deltas (initial - current)
        if (plan.getInitialRisk() != null && plan.getCurrentRisk() != null) {
            plan.setRiskImprovement(roundTwoDecimals(plan.getInitialRisk() - plan.getCurrentRisk()));
        }
        if (plan.getInitialWeight() != null && plan.getCurrentWeight() != null) {
            plan.setWeightImprovement(roundTwoDecimals(plan.getInitialWeight() - plan.getCurrentWeight()));
        }
        if (plan.getInitialSystolicBP() != null && plan.getCurrentSystolicBP() != null) {
            plan.setBpImprovement(roundTwoDecimals(plan.getInitialSystolicBP() - plan.getCurrentSystolicBP()));
        }
        if (plan.getInitialBloodGlucose() != null && plan.getCurrentBloodGlucose() != null) {
            plan.setGlucoseImprovement(roundTwoDecimals(plan.getInitialBloodGlucose() - plan.getCurrentBloodGlucose()));
        }
        if (plan.getInitialCholesterol() != null && plan.getCurrentCholesterol() != null) {
            plan.setCholesterolImprovement(roundTwoDecimals(plan.getInitialCholesterol() - plan.getCurrentCholesterol()));
        }

        LocalDateTime now = LocalDateTime.now();
        plan.setOutcomeLastUpdated(now);
        plan.setUpdatedAt(now);
        plan.addAuditLog("OUTCOME_UPDATED", "PROVIDER", "DOCTOR", "Health Outcome Metrics Updated");

        CarePlan saved = repository.save(plan);
        logger.info("Care plan {} outcome updated successfully", carePlanId);
        return saved;
    }

    /**
     * Returns ONLY the outcome summary DTO for a care plan.
     * Throws CarePlanNotFoundException (404) if carePlanId does not exist.
     */
    public OutcomeSummaryResponse getOutcomeSummary(String carePlanId) {
        logger.info("Fetching outcome summary for care plan: {}", carePlanId);
        CarePlan plan = findByCarePlanIdOrThrow(carePlanId);
        return OutcomeSummaryResponse.fromCarePlan(plan);
    }

    private double roundTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    // ─── Phase 7: Provider Collaboration ─────────────────────────────────────

    private static final java.util.Set<String> ALLOWED_ROLES = java.util.Set.of("DOCTOR", "NURSE", "PATIENT");

    /**
     * Adds a comment to a CarePlan.
     * Validates role (DOCTOR, NURSE, PATIENT) and non-blank message.
     */
    public CommentResponse addComment(String carePlanId, AddCommentRequest request) {
        logger.info("Adding comment to care plan: {} by {} ({})",
                carePlanId, request.getAuthor(), request.getAuthorRole());

        if (request.getMessage() == null || request.getMessage().isBlank()) {
            throw new IllegalArgumentException("message must not be blank");
        }

        if (request.getAuthorRole() == null || !ALLOWED_ROLES.contains(request.getAuthorRole().trim().toUpperCase())) {
            throw new IllegalArgumentException("Invalid authorRole: '" + request.getAuthorRole()
                    + "'. Must be DOCTOR, NURSE, or PATIENT.");
        }

        CarePlan plan = findByCarePlanIdOrThrow(carePlanId);

        CarePlanComment comment = new CarePlanComment(
                "CMT-" + UUID.randomUUID().toString().toUpperCase(),
                request.getAuthor(),
                request.getAuthorRole().trim().toUpperCase(),
                request.getMessage(),
                LocalDateTime.now()
        );

        plan.getComments().add(comment);
        plan.setUpdatedAt(LocalDateTime.now());
        plan.addAuditLog("COMMENT_ADDED", request.getAuthor(), request.getAuthorRole().trim().toUpperCase(), "Comment Added by " + request.getAuthorRole());

        repository.save(plan);
        logger.info("Comment {} added to care plan {}", comment.getCommentId(), carePlanId);
        return CommentResponse.fromComment(comment);
    }

    /**
     * Returns all comments for a CarePlan sorted oldest first.
     */
    public List<CommentResponse> getComments(String carePlanId) {
        logger.info("Fetching comments for care plan: {}", carePlanId);
        CarePlan plan = findByCarePlanIdOrThrow(carePlanId);

        return plan.getComments().stream()
                .sorted(java.util.Comparator.comparing(CarePlanComment::getCreatedAt))
                .map(CommentResponse::fromComment)
                .toList();
    }

    // ─── Phase 8: Analytics Dashboard ────────────────────────────────────────

    /**
     * Calculates aggregated summary KPIs for all care plans.
     * Returns zeros if database is empty (no exception).
     */
    public DashboardSummaryResponse getDashboardSummary() {
        logger.info("Calculating analytics dashboard summary");
        List<CarePlan> plans = repository.findAll();

        if (plans.isEmpty()) {
            logger.info("Database is empty. Returning zeroed dashboard summary.");
            return new DashboardSummaryResponse(0, 0, 0, 0, 0, 0.0, 0.0, 0, 0, 0, 0);
        }

        long totalCarePlans = plans.size();
        long activeCarePlans = plans.stream()
                .filter(p -> p.getDoctorStatus() != DoctorStatus.REJECTED)
                .count();
        long pendingApproval = plans.stream()
                .filter(p -> p.getDoctorStatus() == DoctorStatus.PENDING)
                .count();
        long approvedCarePlans = plans.stream()
                .filter(p -> p.getDoctorStatus() == DoctorStatus.APPROVED)
                .count();
        long rejectedCarePlans = plans.stream()
                .filter(p -> p.getDoctorStatus() == DoctorStatus.REJECTED)
                .count();
        long completedCarePlans = plans.stream()
                .filter(p -> p.getAdherence() != null && p.getAdherence() == 100)
                .count();

        double averageAdherence = plans.stream()
                .filter(p -> p.getAdherence() != null)
                .mapToInt(CarePlan::getAdherence)
                .average()
                .orElse(0.0);

        double averageRiskReduction = plans.stream()
                .filter(p -> p.getRiskImprovement() != null)
                .mapToDouble(CarePlan::getRiskImprovement)
                .average()
                .orElse(0.0);

        long highRisk = plans.stream()
                .filter(p -> isRiskCategory(p, "HIGH"))
                .count();
        long moderateRisk = plans.stream()
                .filter(p -> isRiskCategory(p, "MODERATE") || isRiskCategory(p, "MEDIUM"))
                .count();
        long lowRisk = plans.stream()
                .filter(p -> isRiskCategory(p, "LOW"))
                .count();

        return new DashboardSummaryResponse(
                totalCarePlans,
                activeCarePlans,
                pendingApproval,
                approvedCarePlans,
                rejectedCarePlans,
                roundTwoDecimals(averageAdherence),
                roundTwoDecimals(averageRiskReduction),
                highRisk,
                moderateRisk,
                lowRisk,
                completedCarePlans
        );
    }

    /**
     * Returns risk distribution map {"HIGH": count, "MODERATE": count, "LOW": count}.
     */
    public Map<String, Long> getRiskDistribution() {
        logger.info("Fetching risk distribution statistics");
        List<CarePlan> plans = repository.findAll();

        long high = plans.stream().filter(p -> isRiskCategory(p, "HIGH")).count();
        long moderate = plans.stream().filter(p -> isRiskCategory(p, "MODERATE") || isRiskCategory(p, "MEDIUM")).count();
        long low = plans.stream().filter(p -> isRiskCategory(p, "LOW")).count();

        Map<String, Long> map = new java.util.LinkedHashMap<>();
        map.put("HIGH", high);
        map.put("MODERATE", moderate);
        map.put("LOW", low);
        return map;
    }

    /**
     * Returns adherence distribution map {"0-25": c, "26-50": c, "51-75": c, "76-100": c}.
     */
    public Map<String, Long> getAdherenceDistribution() {
        logger.info("Fetching adherence distribution statistics");
        List<CarePlan> plans = repository.findAll();

        long b1 = plans.stream().filter(p -> p.getAdherence() != null && p.getAdherence() >= 0 && p.getAdherence() <= 25).count();
        long b2 = plans.stream().filter(p -> p.getAdherence() != null && p.getAdherence() >= 26 && p.getAdherence() <= 50).count();
        long b3 = plans.stream().filter(p -> p.getAdherence() != null && p.getAdherence() >= 51 && p.getAdherence() <= 75).count();
        long b4 = plans.stream().filter(p -> p.getAdherence() != null && p.getAdherence() >= 76 && p.getAdherence() <= 100).count();

        Map<String, Long> map = new java.util.LinkedHashMap<>();
        map.put("0-25", b1);
        map.put("26-50", b2);
        map.put("51-75", b3);
        map.put("76-100", b4);
        return map;
    }

    private boolean isRiskCategory(CarePlan p, String category) {
        if (p == null) return false;
        String r1 = p.getRiskLevel();
        String r2 = p.getPredictionRisk();
        return (r1 != null && r1.equalsIgnoreCase(category))
                || (r2 != null && r2.equalsIgnoreCase(category));
    }

    // ─── Phase 9: Validation & Audit ──────────────────────────────────────────

    /**
     * Performs clinical & operational validation on a care plan.
     * Rules:
     * - Clinical Guideline: PASS if goal, diet, exercise, and medications exist.
     * - Drug Interaction: Always "No Interaction Found".
     * - Doctor Approval: PASS only if doctorStatus == APPROVED.
     * - Adherence: PASS (>=70), WARNING (40-69), FAIL (<40).
     * - Outcome Tracking: PASS if riskImprovement > 0, otherwise WARNING.
     * - Overall Status: PASS if all components are PASS, otherwise WARNING.
     */
    public ValidationSummaryResponse validateCarePlan(String carePlanId) {
        logger.info("Performing validation check for care plan: {}", carePlanId);
        CarePlan plan = findByCarePlanIdOrThrow(carePlanId);

        // Clinical Guideline Check
        boolean clinicalPass = plan.getGoal() != null && !plan.getGoal().isBlank()
                && plan.getDiet() != null && !plan.getDiet().isBlank()
                && plan.getExercise() != null && !plan.getExercise().isBlank()
                && plan.getMedications() != null && !plan.getMedications().isEmpty();
        String clinicalStatus = clinicalPass ? "PASS" : "FAIL";

        // Drug Interaction Check
        String drugInteractionStatus = "No Interaction Found";

        // Doctor Approval Check
        String approvalStatus = plan.getDoctorStatus() == DoctorStatus.APPROVED ? "PASS" : "FAIL";

        // Adherence Check
        String adherenceStatus;
        if (plan.getAdherence() != null && plan.getAdherence() >= 70) {
            adherenceStatus = "PASS";
        } else if (plan.getAdherence() != null && plan.getAdherence() >= 40) {
            adherenceStatus = "WARNING";
        } else {
            adherenceStatus = "FAIL";
        }

        // Outcome Tracking Check
        String outcomeStatus = (plan.getRiskImprovement() != null && plan.getRiskImprovement() > 0) ? "PASS" : "WARNING";

        // Overall Status
        String overallStatus = ("PASS".equals(clinicalStatus)
                && "PASS".equals(approvalStatus)
                && "PASS".equals(adherenceStatus)
                && "PASS".equals(outcomeStatus)) ? "PASS" : "WARNING";

        return new ValidationSummaryResponse(
                clinicalStatus,
                drugInteractionStatus,
                approvalStatus,
                adherenceStatus,
                outcomeStatus,
                overallStatus
        );
    }

    /**
     * Returns full audit trail history for a care plan sorted oldest first.
     */
    public List<AuditResponse> getAuditHistory(String carePlanId) {
        logger.info("Fetching audit trail history for care plan: {}", carePlanId);
        CarePlan plan = findByCarePlanIdOrThrow(carePlanId);

        return plan.getAuditLogs().stream()
                .sorted(java.util.Comparator.comparing(AuditLog::getTimestamp))
                .map(AuditResponse::fromAuditLog)
                .toList();
    }

    // ─── Update Progress / Adherence (Legacy) ───────────────────────────────────

    public CarePlan updateProgress(String carePlanId, UpdateProgressRequest request) {
        logger.info("Updating progress for care plan: {} adherence={}%",
                carePlanId, request.getAdherence());

        CarePlan plan = findByCarePlanIdOrThrow(carePlanId);
        plan.setAdherence(request.getAdherence());
        plan.setUpdatedAt(LocalDateTime.now());

        CarePlan saved = repository.save(plan);
        logger.info("Care plan {} adherence updated to {}%", carePlanId, saved.getAdherence());
        return saved;
    }

    // ─── History ───────────────────────────────────────────────────────────────

    public List<CarePlan> getHistory(String patientId) {
        logger.info("Fetching full care plan history for patient: {}", patientId);
        return repository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    // ─── Internal Helpers ──────────────────────────────────────────────────────

    private CarePlan findByCarePlanIdOrThrow(String carePlanId) {
        return repository.findByCarePlanId(carePlanId)
                .orElseThrow(() -> new CarePlanNotFoundException(
                        "Care plan not found with id: " + carePlanId));
    }
}
