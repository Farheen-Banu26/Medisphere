package com.medisphere.careplan_service.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
import com.medisphere.careplan_service.model.CarePlan;
import com.medisphere.careplan_service.service.CarePlanService;

import jakarta.validation.Valid;

/**
 * REST controller for the care plan management API.
 *
 * Endpoints:
 *   POST   /api/careplans/generate                — Create a new AI-assisted care plan
 *   GET    /api/careplans/pending                 — Get all pending care plans (doctorStatus == PENDING)
 *   GET    /api/careplans/{patientId}              — Get the latest care plan for a patient
 *   PUT    /api/careplans/{carePlanId}/approve    — Doctor approves a care plan
 *   PUT    /api/careplans/{carePlanId}/reject     — Doctor rejects a care plan with reason
 *   PUT    /api/careplans/{carePlanId}/doctor-notes — Update doctor notes for a care plan
 *   PUT    /api/careplans/approve/{carePlanId}     — Generic approve/reject endpoint (legacy)
 *   PUT    /api/careplans/progress/{carePlanId}    — Update patient adherence progress
 *   GET    /api/careplans/history/{patientId}      — Full history of care plans for a patient
 */
@RestController
@RequestMapping("/api/careplans")
@Validated
public class CarePlanController {

    private final CarePlanService carePlanService;

    public CarePlanController(CarePlanService carePlanService) {
        this.carePlanService = carePlanService;
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<String> handleResponseStatusException(org.springframework.web.server.ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(ex.getReason());
    }

    /**
     * POST /api/careplans/generate
     *
     * Creates an AI-assisted care plan and persists it to MongoDB with PENDING status.
     * Returns 201 Created.
     */
    @PostMapping("/generate")
    public ResponseEntity<CarePlan> generateCarePlan(
            @Valid @RequestBody GenerateCarePlanRequest request) {
        CarePlan created = carePlanService.generateCarePlan(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * GET /api/careplans/pending
     *
     * Returns all care plans with doctorStatus == PENDING.
     */
    @GetMapping("/pending")
    public ResponseEntity<List<CarePlan>> getPendingCarePlans() {
        List<CarePlan> pending = carePlanService.getPendingCarePlans();
        return ResponseEntity.ok(pending);
    }

    /**
     * GET /api/careplans/all
     *
     * Returns all care plans across all patients.
     */
    @GetMapping("/all")
    public ResponseEntity<List<CarePlan>> getAllCarePlans() {
        List<CarePlan> plans = carePlanService.getAllCarePlans();
        return ResponseEntity.ok(plans);
    }

    /**
     * GET /api/careplans/approved
     *
     * Returns all care plans with doctorStatus == APPROVED.
     */
    @GetMapping("/approved")
    public ResponseEntity<List<CarePlan>> getApprovedCarePlans() {
        List<CarePlan> approved = carePlanService.getApprovedCarePlans();
        return ResponseEntity.ok(approved);
    }

    /**
     * GET /api/careplans/rejected
     *
     * Returns all care plans with doctorStatus == REJECTED.
     */
    @GetMapping("/rejected")
    public ResponseEntity<List<CarePlan>> getRejectedCarePlans() {
        List<CarePlan> rejected = carePlanService.getRejectedCarePlans();
        return ResponseEntity.ok(rejected);
    }

    /**
     * GET /api/careplans/{patientId}
     *
     * Returns the most recent care plan for the given patient (all status levels for doctor/admin view).
     * Returns 404 if no care plan exists.
     */
    @GetMapping("/{patientId}")
    public ResponseEntity<CarePlan> getCarePlanByPatient(
            @PathVariable String patientId,
            jakarta.servlet.http.HttpServletRequest request) {
        carePlanService.verifyPatientResourceAccess(patientId, request);
        CarePlan plan = carePlanService.getLatestByPatient(patientId);
        if (plan == null) {
            throw new CarePlanNotFoundException(
                    "No care plan found for patient: " + patientId);
        }
        return ResponseEntity.ok(plan);
    }

    // ─── Patient Care Plan Endpoints ──────────────────────────────────────────

    /**
     * GET /api/careplans/patient/{patientId}
     *
     * Returns ONLY the latest APPROVED care plan for a patient.
     * Returns 404 if no APPROVED care plan exists.
     */
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<CarePlan> getLatestApprovedCarePlan(
            @PathVariable String patientId,
            jakarta.servlet.http.HttpServletRequest request) {
        carePlanService.verifyPatientResourceAccess(patientId, request);
        CarePlan approved = carePlanService.getLatestApprovedCarePlan(patientId);
        return ResponseEntity.ok(approved);
    }

    /**
     * GET /api/careplans/patient/{patientId}/history
     *
     * Returns every APPROVED care plan for a patient, sorted newest first.
     * Returns 404 if no APPROVED care plan exists.
     */
    @GetMapping("/patient/{patientId}/history")
    public ResponseEntity<List<CarePlan>> getApprovedCarePlanHistory(
            @PathVariable String patientId,
            jakarta.servlet.http.HttpServletRequest request) {
        carePlanService.verifyPatientResourceAccess(patientId, request);
        List<CarePlan> history = carePlanService.getApprovedCarePlanHistory(patientId);
        return ResponseEntity.ok(history);
    }

    /**
     * GET /api/careplans/patient/{patientId}/today
     *
     * Returns today's care plan summary DTO for a patient based on the latest APPROVED care plan.
     * Returns 404 if no APPROVED care plan exists.
     */
    @GetMapping("/patient/{patientId}/today")
    public ResponseEntity<TodayCarePlanResponse> getTodayCarePlanSummary(
            @PathVariable String patientId,
            jakarta.servlet.http.HttpServletRequest request) {
        carePlanService.verifyPatientResourceAccess(patientId, request);
        TodayCarePlanResponse summary = carePlanService.getTodayCarePlanSummary(patientId);
        return ResponseEntity.ok(summary);
    }

    /**
     * PUT /api/careplans/{carePlanId}/approve
     *
     * Doctor approves a care plan (PENDING -> APPROVED).
     * Body: { "approvedBy": "doctor1", "doctorNotes": "..." }
     */
    @PutMapping("/{carePlanId}/approve")
    public ResponseEntity<CarePlan> doctorApproveCarePlan(
            @PathVariable String carePlanId,
            @Valid @RequestBody DoctorApproveRequest request) {
        CarePlan updated = carePlanService.approveCarePlanByDoctor(carePlanId, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * PUT /api/careplans/{carePlanId}/reject
     *
     * Doctor rejects a care plan (PENDING -> REJECTED).
     * Body: { "rejectedBy": "doctor1", "reason": "..." }
     */
    @PutMapping("/{carePlanId}/reject")
    public ResponseEntity<CarePlan> doctorRejectCarePlan(
            @PathVariable String carePlanId,
            @Valid @RequestBody DoctorRejectRequest request) {
        CarePlan updated = carePlanService.rejectCarePlanByDoctor(carePlanId, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * PUT /api/careplans/{carePlanId}/update
     *
     * Doctor updates any or all content sections of a care plan prior to approval.
     * Body: UpdateCarePlanRequest
     */
    @PutMapping("/{carePlanId}/update")
    public ResponseEntity<CarePlan> updateCarePlan(
            @PathVariable String carePlanId,
            @RequestBody UpdateCarePlanRequest request) {
        CarePlan updated = carePlanService.updateCarePlan(carePlanId, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * PUT /api/careplans/{carePlanId}/doctor-notes
     *
     * Updates doctor notes for a care plan.
     * Body: { "doctorNotes": "..." }
     */
    @PutMapping("/{carePlanId}/doctor-notes")
    public ResponseEntity<CarePlan> updateDoctorNotes(
            @PathVariable String carePlanId,
            @Valid @RequestBody UpdateDoctorNotesRequest request) {
        CarePlan updated = carePlanService.updateDoctorNotes(carePlanId, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * PUT /api/careplans/{carePlanId}/adherence
     *
     * Updates daily activity completion flags and automatically calculates adherence percentage (0–100%).
     * Body: UpdateAdherenceRequest
     */
    @PutMapping("/{carePlanId}/adherence")
    public ResponseEntity<CarePlan> updateAdherence(
            @PathVariable String carePlanId,
            @RequestBody UpdateAdherenceRequest request) {
        CarePlan updated = carePlanService.updateAdherence(carePlanId, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * PUT /api/careplans/{carePlanId}/outcome
     *
     * Updates patient current health metrics and automatically calculates improvement deltas.
     * Body: OutcomeTrackingRequest
     */
    @PutMapping("/{carePlanId}/outcome")
    public ResponseEntity<CarePlan> updateOutcome(
            @PathVariable String carePlanId,
            @RequestBody OutcomeTrackingRequest request) {
        CarePlan updated = carePlanService.updateOutcome(carePlanId, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * GET /api/careplans/{carePlanId}/outcome
     *
     * Returns ONLY the outcome summary DTO for a care plan (initial, current, and improvement metrics).
     * Returns 404 if care plan does not exist.
     */
    @GetMapping("/{carePlanId}/outcome")
    public ResponseEntity<OutcomeSummaryResponse> getOutcomeSummary(@PathVariable String carePlanId) {
        OutcomeSummaryResponse summary = carePlanService.getOutcomeSummary(carePlanId);
        return ResponseEntity.ok(summary);
    }

    // ─── Phase 7: Provider Collaboration Endpoints ────────────────────────────

    /**
     * POST /api/careplans/{carePlanId}/comments
     *
     * Adds a collaboration comment (authorRole: DOCTOR, NURSE, PATIENT).
     * Body: AddCommentRequest
     */
    @PostMapping("/{carePlanId}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable String carePlanId,
            @Valid @RequestBody AddCommentRequest request) {
        CommentResponse created = carePlanService.addComment(carePlanId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * GET /api/careplans/{carePlanId}/comments
     *
     * Returns all collaboration comments for a care plan sorted oldest first.
     */
    @GetMapping("/{carePlanId}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable String carePlanId) {
        List<CommentResponse> comments = carePlanService.getComments(carePlanId);
        return ResponseEntity.ok(comments);
    }

    // ─── Phase 8: Analytics Dashboard Endpoints ──────────────────────────────

    /**
     * GET /api/careplans/dashboard/summary
     *
     * Returns aggregated KPI statistics for all care plans.
     * Returns zeroed values if database is empty.
     */
    @GetMapping("/dashboard/summary")
    public ResponseEntity<DashboardSummaryResponse> getDashboardSummary() {
        DashboardSummaryResponse summary = carePlanService.getDashboardSummary();
        return ResponseEntity.ok(summary);
    }

    /**
     * GET /api/careplans/dashboard/risk-distribution
     *
     * Returns patient count distribution across HIGH, MODERATE, and LOW risk levels.
     */
    @GetMapping("/dashboard/risk-distribution")
    public ResponseEntity<Map<String, Long>> getRiskDistribution() {
        Map<String, Long> distribution = carePlanService.getRiskDistribution();
        return ResponseEntity.ok(distribution);
    }

    /**
     * GET /api/careplans/dashboard/adherence-distribution
     *
     * Returns patient count distribution across 4 adherence buckets (0-25, 26-50, 51-75, 76-100).
     */
    @GetMapping("/dashboard/adherence-distribution")
    public ResponseEntity<Map<String, Long>> getAdherenceDistribution() {
        Map<String, Long> distribution = carePlanService.getAdherenceDistribution();
        return ResponseEntity.ok(distribution);
    }

    // ─── Phase 9: Validation & Audit Endpoints ────────────────────────────────

    /**
     * GET /api/careplans/{carePlanId}/validation
     *
     * Returns clinical and operational validation status across 5 checks plus overall status.
     * Returns 404 if care plan does not exist.
     */
    @GetMapping("/{carePlanId}/validation")
    public ResponseEntity<ValidationSummaryResponse> validateCarePlan(@PathVariable String carePlanId) {
        ValidationSummaryResponse summary = carePlanService.validateCarePlan(carePlanId);
        return ResponseEntity.ok(summary);
    }

    /**
     * GET /api/careplans/{carePlanId}/audit
     *
     * Returns full audit trail history for a care plan sorted oldest first.
     * Returns 404 if care plan does not exist.
     */
    @GetMapping("/{carePlanId}/audit")
    public ResponseEntity<List<AuditResponse>> getAuditHistory(@PathVariable String carePlanId) {
        List<AuditResponse> auditLogs = carePlanService.getAuditHistory(carePlanId);
        return ResponseEntity.ok(auditLogs);
    }

    /**
     * PUT /api/careplans/approve/{carePlanId}
     *
     * Generic approve/reject endpoint (legacy support).
     */
    @PutMapping("/approve/{carePlanId}")
    public ResponseEntity<CarePlan> approveCarePlan(
            @PathVariable String carePlanId,
            @Valid @RequestBody ApproveCarePlanRequest request) {
        CarePlan updated = carePlanService.approveCarePlan(carePlanId, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * PUT /api/careplans/progress/{carePlanId}
     *
     * Updates the patient adherence percentage (0–100) for a care plan.
     */
    @PutMapping("/progress/{carePlanId}")
    public ResponseEntity<CarePlan> updateProgress(
            @PathVariable String carePlanId,
            @Valid @RequestBody UpdateProgressRequest request) {
        CarePlan updated = carePlanService.updateProgress(carePlanId, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * GET /api/careplans/history/{patientId}
     *
     * Returns all care plans for a patient in reverse-chronological order.
     */
    @GetMapping("/history/{patientId}")
    public ResponseEntity<List<CarePlan>> getHistory(@PathVariable String patientId) {
        List<CarePlan> history = carePlanService.getHistory(patientId);
        return ResponseEntity.ok(history);
    }
}
