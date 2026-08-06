package com.medisphere.careplan_service.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.medisphere.careplan_service.client.FlaskClient;
import com.medisphere.careplan_service.client.HealthTwinClient;
import com.medisphere.careplan_service.client.PatientClient;
import com.medisphere.careplan_service.dto.DashboardSummaryResponse;
import com.medisphere.careplan_service.model.CarePlan;
import com.medisphere.careplan_service.model.DoctorStatus;
import com.medisphere.careplan_service.repository.CarePlanRepository;

@ExtendWith(MockitoExtension.class)
class AnalyticsDashboardTest {

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

    private CarePlan createPlan(String id, DoctorStatus status, String risk, Integer adherence, Double riskImprovement) {
        CarePlan plan = new CarePlan();
        plan.setCarePlanId(id);
        plan.setPatientId("P-" + id);
        plan.setDoctorStatus(status);
        plan.setRiskLevel(risk);
        plan.setPredictionRisk(risk);
        plan.setAdherence(adherence);
        plan.setRiskImprovement(riskImprovement);
        plan.setCreatedAt(LocalDateTime.now().minusDays(5));
        plan.setUpdatedAt(LocalDateTime.now().minusDays(1));
        return plan;
    }

    @Test
    @DisplayName("1. Dashboard Summary — Correct total, active, pending, approved, rejected & completed counts")
    void testDashboardSummaryCalculations() {
        CarePlan p1 = createPlan("CP-1", DoctorStatus.APPROVED, "HIGH", 100, 12.5);
        CarePlan p2 = createPlan("CP-2", DoctorStatus.APPROVED, "MODERATE", 80, 8.0);
        CarePlan p3 = createPlan("CP-3", DoctorStatus.PENDING, "LOW", 50, 4.0);
        CarePlan p4 = createPlan("CP-4", DoctorStatus.REJECTED, "HIGH", 20, 0.0);

        when(repository.findAll()).thenReturn(List.of(p1, p2, p3, p4));

        DashboardSummaryResponse summary = service.getDashboardSummary();

        assertNotNull(summary);
        assertEquals(4, summary.getTotalCarePlans());
        assertEquals(3, summary.getActiveCarePlans()); // 4 total - 1 rejected
        assertEquals(1, summary.getPendingApproval());
        assertEquals(2, summary.getApprovedCarePlans());
        assertEquals(1, summary.getRejectedCarePlans());
        assertEquals(1, summary.getCompletedCarePlans()); // adherence == 100
    }

    @Test
    @DisplayName("2. Average Adherence — Calculates correct mean adherence percentage")
    void testAverageAdherence() {
        CarePlan p1 = createPlan("CP-1", DoctorStatus.APPROVED, "HIGH", 100, 10.0);
        CarePlan p2 = createPlan("CP-2", DoctorStatus.APPROVED, "MODERATE", 50, 5.0);

        when(repository.findAll()).thenReturn(List.of(p1, p2));

        DashboardSummaryResponse summary = service.getDashboardSummary();

        assertEquals(75.0, summary.getAverageAdherence());
    }

    @Test
    @DisplayName("3. Average Risk Reduction — Calculates correct mean risk improvement")
    void testAverageRiskReduction() {
        CarePlan p1 = createPlan("CP-1", DoctorStatus.APPROVED, "HIGH", 90, 15.0);
        CarePlan p2 = createPlan("CP-2", DoctorStatus.APPROVED, "MODERATE", 70, 5.0);

        when(repository.findAll()).thenReturn(List.of(p1, p2));

        DashboardSummaryResponse summary = service.getDashboardSummary();

        assertEquals(10.0, summary.getAverageRiskReduction());
    }

    @Test
    @DisplayName("4. Risk Category Counts — Correct HIGH, MODERATE, and LOW patient counts")
    void testRiskCategoryCounts() {
        CarePlan p1 = createPlan("CP-1", DoctorStatus.APPROVED, "HIGH", 80, 10.0);
        CarePlan p2 = createPlan("CP-2", DoctorStatus.APPROVED, "HIGH", 90, 12.0);
        CarePlan p3 = createPlan("CP-3", DoctorStatus.APPROVED, "MODERATE", 70, 5.0);
        CarePlan p4 = createPlan("CP-4", DoctorStatus.APPROVED, "LOW", 60, 2.0);

        when(repository.findAll()).thenReturn(List.of(p1, p2, p3, p4));

        DashboardSummaryResponse summary = service.getDashboardSummary();

        assertEquals(2, summary.getHighRiskPatients());
        assertEquals(1, summary.getModerateRiskPatients());
        assertEquals(1, summary.getLowRiskPatients());
    }

    @Test
    @DisplayName("5. Empty Database — Returns zeroed KPIs with no exception thrown")
    void testEmptyDatabaseReturnsZeros() {
        when(repository.findAll()).thenReturn(Collections.emptyList());

        DashboardSummaryResponse summary = service.getDashboardSummary();

        assertNotNull(summary);
        assertEquals(0, summary.getTotalCarePlans());
        assertEquals(0, summary.getActiveCarePlans());
        assertEquals(0, summary.getPendingApproval());
        assertEquals(0, summary.getApprovedCarePlans());
        assertEquals(0, summary.getRejectedCarePlans());
        assertEquals(0.0, summary.getAverageAdherence());
        assertEquals(0.0, summary.getAverageRiskReduction());
        assertEquals(0, summary.getHighRiskPatients());
        assertEquals(0, summary.getModerateRiskPatients());
        assertEquals(0, summary.getLowRiskPatients());
        assertEquals(0, summary.getCompletedCarePlans());
    }

    @Test
    @DisplayName("6. Risk Distribution Endpoint — Returns HIGH, MODERATE, LOW distribution map")
    void testRiskDistributionEndpoint() {
        CarePlan p1 = createPlan("CP-1", DoctorStatus.APPROVED, "HIGH", 80, 10.0);
        CarePlan p2 = createPlan("CP-2", DoctorStatus.APPROVED, "MODERATE", 70, 5.0);
        CarePlan p3 = createPlan("CP-3", DoctorStatus.APPROVED, "LOW", 60, 2.0);

        when(repository.findAll()).thenReturn(List.of(p1, p2, p3));

        Map<String, Long> dist = service.getRiskDistribution();

        assertEquals(1L, dist.get("HIGH"));
        assertEquals(1L, dist.get("MODERATE"));
        assertEquals(1L, dist.get("LOW"));
    }

    @Test
    @DisplayName("7. Adherence Distribution Endpoint — Returns 4-bucket adherence distribution map")
    void testAdherenceDistributionEndpoint() {
        CarePlan p1 = createPlan("CP-1", DoctorStatus.APPROVED, "HIGH", 15, 10.0);  // 0-25
        CarePlan p2 = createPlan("CP-2", DoctorStatus.APPROVED, "MODERATE", 40, 5.0); // 26-50
        CarePlan p3 = createPlan("CP-3", DoctorStatus.APPROVED, "LOW", 65, 2.0);    // 51-75
        CarePlan p4 = createPlan("CP-4", DoctorStatus.APPROVED, "LOW", 90, 8.0);    // 76-100

        when(repository.findAll()).thenReturn(List.of(p1, p2, p3, p4));

        Map<String, Long> dist = service.getAdherenceDistribution();

        assertEquals(1L, dist.get("0-25"));
        assertEquals(1L, dist.get("26-50"));
        assertEquals(1L, dist.get("51-75"));
        assertEquals(1L, dist.get("76-100"));
    }
}
