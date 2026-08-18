package com.medisphere.careplan_service.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
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
import com.medisphere.careplan_service.dto.OutcomeSummaryResponse;
import com.medisphere.careplan_service.dto.OutcomeTrackingRequest;
import com.medisphere.careplan_service.exception.CarePlanNotFoundException;
import com.medisphere.careplan_service.model.CarePlan;
import com.medisphere.careplan_service.model.DoctorStatus;
import com.medisphere.careplan_service.repository.CarePlanRepository;

@ExtendWith(MockitoExtension.class)
class OutcomeTrackingTest {

    @Mock
    private CarePlanRepository repository;

    @Mock
    private PatientClient patientClient;

    @Mock
    private HealthTwinClient healthTwinClient;

    @Mock
    private FlaskClient flaskClient;

    @Mock
    private com.medisphere.careplan_service.client.GeminiClient geminiClient;

    private CarePlanService service;

    @BeforeEach
    void setUp() {
        service = new CarePlanService(repository, patientClient, healthTwinClient, flaskClient, geminiClient);
    }

    private CarePlan createSamplePlanWithInitialMetrics(String carePlanId) {
        CarePlan plan = new CarePlan();
        plan.setCarePlanId(carePlanId);
        plan.setPatientId("P1001");
        plan.setDoctorStatus(DoctorStatus.APPROVED);
        plan.setInitialRisk(25.4);
        plan.setInitialWeight(85.0);
        plan.setInitialSystolicBP(140.0);
        plan.setInitialDiastolicBP(90.0);
        plan.setInitialBloodGlucose(150.0);
        plan.setInitialCholesterol(220.0);
        plan.setCreatedAt(LocalDateTime.now().minusDays(10));
        plan.setUpdatedAt(LocalDateTime.now().minusDays(10));
        return plan;
    }

    @Test
    @DisplayName("1. Risk Improvement Calculation — initialRisk (25.4) - currentRisk (16.2) = 9.2")
    void testRiskImprovementCalculation() {
        CarePlan plan = createSamplePlanWithInitialMetrics("CP-OUT-101");
        when(repository.findByCarePlanId("CP-OUT-101")).thenReturn(Optional.of(plan));
        when(repository.save(any(CarePlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OutcomeTrackingRequest req = new OutcomeTrackingRequest(16.2, 85.0, 140.0, 90.0, 150.0, 220.0);
        CarePlan result = service.updateOutcome("CP-OUT-101", req);

        assertEquals(16.2, result.getCurrentRisk());
        assertEquals(9.2, result.getRiskImprovement());
        assertNotNull(result.getOutcomeLastUpdated());
    }

    @Test
    @DisplayName("2. Weight Improvement Calculation — initialWeight (85.0) - currentWeight (80.0) = 5.0")
    void testWeightImprovementCalculation() {
        CarePlan plan = createSamplePlanWithInitialMetrics("CP-OUT-102");
        when(repository.findByCarePlanId("CP-OUT-102")).thenReturn(Optional.of(plan));
        when(repository.save(any(CarePlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OutcomeTrackingRequest req = new OutcomeTrackingRequest(25.4, 80.0, 140.0, 90.0, 150.0, 220.0);
        CarePlan result = service.updateOutcome("CP-OUT-102", req);

        assertEquals(80.0, result.getCurrentWeight());
        assertEquals(5.0, result.getWeightImprovement());
    }

    @Test
    @DisplayName("3. BP Improvement Calculation — initialSystolicBP (140.0) - currentSystolicBP (125.0) = 15.0")
    void testBpImprovementCalculation() {
        CarePlan plan = createSamplePlanWithInitialMetrics("CP-OUT-103");
        when(repository.findByCarePlanId("CP-OUT-103")).thenReturn(Optional.of(plan));
        when(repository.save(any(CarePlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OutcomeTrackingRequest req = new OutcomeTrackingRequest(25.4, 85.0, 125.0, 80.0, 150.0, 220.0);
        CarePlan result = service.updateOutcome("CP-OUT-103", req);

        assertEquals(125.0, result.getCurrentSystolicBP());
        assertEquals(80.0, result.getCurrentDiastolicBP());
        assertEquals(15.0, result.getBpImprovement());
    }

    @Test
    @DisplayName("4. Glucose Improvement Calculation — initialBloodGlucose (150.0) - currentBloodGlucose (120.0) = 30.0")
    void testGlucoseImprovementCalculation() {
        CarePlan plan = createSamplePlanWithInitialMetrics("CP-OUT-104");
        when(repository.findByCarePlanId("CP-OUT-104")).thenReturn(Optional.of(plan));
        when(repository.save(any(CarePlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OutcomeTrackingRequest req = new OutcomeTrackingRequest(25.4, 85.0, 140.0, 90.0, 120.0, 220.0);
        CarePlan result = service.updateOutcome("CP-OUT-104", req);

        assertEquals(120.0, result.getCurrentBloodGlucose());
        assertEquals(30.0, result.getGlucoseImprovement());
    }

    @Test
    @DisplayName("5. Cholesterol Improvement Calculation — initialCholesterol (220.0) - currentCholesterol (180.0) = 40.0")
    void testCholesterolImprovementCalculation() {
        CarePlan plan = createSamplePlanWithInitialMetrics("CP-OUT-105");
        when(repository.findByCarePlanId("CP-OUT-105")).thenReturn(Optional.of(plan));
        when(repository.save(any(CarePlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OutcomeTrackingRequest req = new OutcomeTrackingRequest(25.4, 85.0, 140.0, 90.0, 150.0, 180.0);
        CarePlan result = service.updateOutcome("CP-OUT-105", req);

        assertEquals(180.0, result.getCurrentCholesterol());
        assertEquals(40.0, result.getCholesterolImprovement());
    }

    @Test
    @DisplayName("6. GET Outcome Summary DTO — Returns OutcomeSummaryResponse with initial, current & improvement metrics")
    void testGetOutcomeSummary() {
        CarePlan plan = createSamplePlanWithInitialMetrics("CP-OUT-106");
        plan.setCurrentRisk(16.2);
        plan.setRiskImprovement(9.2);
        plan.setCurrentWeight(80.0);
        plan.setWeightImprovement(5.0);

        when(repository.findByCarePlanId("CP-OUT-106")).thenReturn(Optional.of(plan));

        OutcomeSummaryResponse summary = service.getOutcomeSummary("CP-OUT-106");

        assertNotNull(summary);
        assertEquals("CP-OUT-106", summary.getCarePlanId());
        assertEquals("P1001", summary.getPatientId());
        assertEquals(25.4, summary.getInitialRisk());
        assertEquals(16.2, summary.getCurrentRisk());
        assertEquals(9.2, summary.getRiskImprovement());
        assertEquals(5.0, summary.getWeightImprovement());
    }

    @Test
    @DisplayName("7. Non-existent CarePlanId -> Throws 404 CarePlanNotFoundException")
    void testOutcomeUpdateNotFoundThrows404() {
        when(repository.findByCarePlanId("CP-NOTFOUND")).thenReturn(Optional.empty());

        OutcomeTrackingRequest req = new OutcomeTrackingRequest(16.2, 80.0, 125.0, 80.0, 120.0, 180.0);

        assertThrows(CarePlanNotFoundException.class, () -> {
            service.updateOutcome("CP-NOTFOUND", req);
        });
    }
}
