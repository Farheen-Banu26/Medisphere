package com.medisphere.careplan_service.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.medisphere.careplan_service.client.FlaskClient;
import com.medisphere.careplan_service.client.HealthTwinClient;
import com.medisphere.careplan_service.client.PatientClient;
import com.medisphere.careplan_service.dto.AuditResponse;
import com.medisphere.careplan_service.dto.ValidationSummaryResponse;
import com.medisphere.careplan_service.exception.CarePlanNotFoundException;
import com.medisphere.careplan_service.model.AuditLog;
import com.medisphere.careplan_service.model.CarePlan;
import com.medisphere.careplan_service.model.DoctorStatus;
import com.medisphere.careplan_service.repository.CarePlanRepository;

@ExtendWith(MockitoExtension.class)
class ValidationAndAuditTest {

    @Mock
    private CarePlanRepository repository;

    @Mock
    private PatientClient patientClient;

    @Mock
    private HealthTwinClient healthTwinClient;

    @Mock
    private FlaskClient flaskClient;

    private CarePlanService service;

    @BeforeEach
    void setUp() {
        service = new CarePlanService(repository, patientClient, healthTwinClient, flaskClient);
    }

    private CarePlan createCompleteValidPlan(String carePlanId) {
        CarePlan plan = new CarePlan();
        plan.setCarePlanId(carePlanId);
        plan.setPatientId("P1001");
        plan.setGoal("Lower blood pressure and manage weight");
        plan.setDiet("Low Sodium Healthy Diet");
        plan.setExercise("30 min walking");
        plan.setMedications(List.of("Lisinopril"));
        plan.setDoctorStatus(DoctorStatus.APPROVED);
        plan.setAdherence(85);
        plan.setRiskImprovement(12.4);
        plan.setCreatedAt(LocalDateTime.now().minusDays(2));
        plan.setUpdatedAt(LocalDateTime.now().minusDays(1));
        return plan;
    }

    @Test
    @DisplayName("1. Clinical Validation — PASS when goal, diet, exercise, meds present; FAIL when goal missing")
    void testClinicalValidation() {
        CarePlan plan = createCompleteValidPlan("CP-VAL-101");
        when(repository.findByCarePlanId("CP-VAL-101")).thenReturn(Optional.of(plan));

        ValidationSummaryResponse summary = service.validateCarePlan("CP-VAL-101");
        assertEquals("PASS", summary.getClinicalGuidelineStatus());

        // Test failure when goal is missing
        plan.setGoal(null);
        ValidationSummaryResponse summary2 = service.validateCarePlan("CP-VAL-101");
        assertEquals("FAIL", summary2.getClinicalGuidelineStatus());
    }

    @Test
    @DisplayName("2. Drug Interaction Validation — Always returns 'No Interaction Found'")
    void testDrugInteractionValidation() {
        CarePlan plan = createCompleteValidPlan("CP-VAL-102");
        when(repository.findByCarePlanId("CP-VAL-102")).thenReturn(Optional.of(plan));

        ValidationSummaryResponse summary = service.validateCarePlan("CP-VAL-102");
        assertEquals("No Interaction Found", summary.getDrugInteractionStatus());
    }

    @Test
    @DisplayName("3. Doctor Approval Validation — PASS when APPROVED, FAIL when PENDING or REJECTED")
    void testDoctorApprovalValidation() {
        CarePlan plan = createCompleteValidPlan("CP-VAL-103");
        when(repository.findByCarePlanId("CP-VAL-103")).thenReturn(Optional.of(plan));

        ValidationSummaryResponse summary = service.validateCarePlan("CP-VAL-103");
        assertEquals("PASS", summary.getDoctorApprovalStatus());

        plan.setDoctorStatus(DoctorStatus.PENDING);
        ValidationSummaryResponse summary2 = service.validateCarePlan("CP-VAL-103");
        assertEquals("FAIL", summary2.getDoctorApprovalStatus());
    }

    @Test
    @DisplayName("4. Adherence Validation — PASS (>=70), WARNING (40-69), FAIL (<40)")
    void testAdherenceValidation() {
        CarePlan plan = createCompleteValidPlan("CP-VAL-104");
        when(repository.findByCarePlanId("CP-VAL-104")).thenReturn(Optional.of(plan));

        // >= 70 -> PASS
        plan.setAdherence(75);
        assertEquals("PASS", service.validateCarePlan("CP-VAL-104").getAdherenceStatus());

        // 40-69 -> WARNING
        plan.setAdherence(55);
        assertEquals("WARNING", service.validateCarePlan("CP-VAL-104").getAdherenceStatus());

        // < 40 -> FAIL
        plan.setAdherence(20);
        assertEquals("FAIL", service.validateCarePlan("CP-VAL-104").getAdherenceStatus());
    }

    @Test
    @DisplayName("5. Outcome Validation — PASS when riskImprovement > 0, WARNING otherwise")
    void testOutcomeValidation() {
        CarePlan plan = createCompleteValidPlan("CP-VAL-105");
        when(repository.findByCarePlanId("CP-VAL-105")).thenReturn(Optional.of(plan));

        // riskImprovement > 0 -> PASS
        plan.setRiskImprovement(5.2);
        assertEquals("PASS", service.validateCarePlan("CP-VAL-105").getOutcomeTrackingStatus());

        // riskImprovement <= 0 -> WARNING
        plan.setRiskImprovement(0.0);
        assertEquals("WARNING", service.validateCarePlan("CP-VAL-105").getOutcomeTrackingStatus());
    }

    @Test
    @DisplayName("6. Audit Ordering — Audit logs returned sorted oldest first (chronological order)")
    void testAuditOrderingOldestFirst() {
        CarePlan plan = createCompleteValidPlan("CP-AUD-106");

        AuditLog a1 = new AuditLog("AUD-1", "GENERATED", "AI_SYSTEM", "SYSTEM", "Care Plan Generated", LocalDateTime.now().minusHours(3));
        AuditLog a2 = new AuditLog("AUD-2", "APPROVED", "doctor1", "DOCTOR", "Doctor Approved Care Plan", LocalDateTime.now().minusHours(2));
        AuditLog a3 = new AuditLog("AUD-3", "ADHERENCE_UPDATED", "PATIENT", "PATIENT", "Patient Updated Daily Adherence", LocalDateTime.now().minusHours(1));

        plan.getAuditLogs().addAll(List.of(a3, a1, a2)); // Added out of order

        when(repository.findByCarePlanId("CP-AUD-106")).thenReturn(Optional.of(plan));

        List<AuditResponse> logs = service.getAuditHistory("CP-AUD-106");

        assertEquals(3, logs.size());
        assertEquals("AUD-1", logs.get(0).getAuditId());
        assertEquals("AUD-2", logs.get(1).getAuditId());
        assertEquals("AUD-3", logs.get(2).getAuditId());
    }

    @Test
    @DisplayName("7. Non-existent CarePlanId -> Throws 404 CarePlanNotFoundException for validation and audit")
    void testNotFoundThrows404() {
        when(repository.findByCarePlanId("CP-NOTFOUND")).thenReturn(Optional.empty());

        assertThrows(CarePlanNotFoundException.class, () -> {
            service.validateCarePlan("CP-NOTFOUND");
        });

        assertThrows(CarePlanNotFoundException.class, () -> {
            service.getAuditHistory("CP-NOTFOUND");
        });
    }
}
