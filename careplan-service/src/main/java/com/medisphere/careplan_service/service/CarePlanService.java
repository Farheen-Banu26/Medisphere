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

    private final CarePlanRepository repository;
    private final PatientClient patientClient;
    private final HealthTwinClient healthTwinClient;
    private final FlaskClient flaskClient;
    private final CarePlanRecommendationEngine recommendationEngine;
    private final List<String> featureColumns;
    private final ObjectMapper mapper = new ObjectMapper();

    public CarePlanService(CarePlanRepository repository,
                           PatientClient patientClient,
                           HealthTwinClient healthTwinClient,
                           FlaskClient flaskClient) {
        this.repository = repository;
        this.patientClient = patientClient;
        this.healthTwinClient = healthTwinClient;
        this.flaskClient = flaskClient;
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
     * Creates an AI-assisted care plan for a patient.
     * Invokes Flask AI service using patient & health twin features,
     * and uses fallback recommendation logic if Flask AI is unavailable.
     */
    public CarePlan generateCarePlan(GenerateCarePlanRequest request) {
        String patientId = request.getPatientId();
        logger.info("Generating AI care plan for patient: {}", patientId);

        CarePlanRecommendationResult recommendation = null;

        try {
            PatientDTO patient = patientClient.getPatient(patientId);
            HealthTwinDTO twin = healthTwinClient.getHealthTwin(patientId);

            if (patient != null && twin != null) {
                Map<String, Object> features = buildFeatureMap(patient, twin);
                FlaskRequest flaskReq = new FlaskRequest(features);
                FlaskResponse flaskResp = flaskClient.predict(flaskReq);
                recommendation = recommendationEngine.generate(flaskResp, request.getPredictionRisk());
                logger.info("Successfully generated AI care plan via Flask for patient {}", patientId);
            } else {
                logger.warn("Missing patient or health twin data for {}. Using fallback recommendations.", patientId);
                recommendation = recommendationEngine.generateFallback(request.getPredictionRisk());
            }
        } catch (Exception ex) {
            logger.error("Flask AI or service call failed for patient {}: {}. Continuing with fallback rules.",
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
        plan.setAiRecommendation(recommendation.aiRecommendation());
        plan.setLifestyleAdvice(recommendation.lifestyleAdvice());
        plan.setReviewIntervalDays(recommendation.reviewIntervalDays());
        plan.setGeneratedBy(recommendation.generatedBy());
        plan.setGenerationTime(LocalDateTime.now());

        // Field Overrides or Defaults
        plan.setGoal(request.getGoal() != null && !request.getGoal().isBlank()
                ? request.getGoal()
                : "Clinical Care & Wellness Goal for " + recommendation.riskLevel() + " Risk Profile");

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
        plan.addAuditLog("GENERATED", "AI_SYSTEM", "SYSTEM", "Care Plan Generated");

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
