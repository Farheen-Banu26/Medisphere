package com.medisphere.careplan_service.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.medisphere.careplan_service.client.FlaskClient;
import com.medisphere.careplan_service.client.HealthTwinClient;
import com.medisphere.careplan_service.client.PatientClient;
import com.medisphere.careplan_service.dto.TodayCarePlanResponse;
import com.medisphere.careplan_service.exception.CarePlanNotFoundException;
import com.medisphere.careplan_service.model.CarePlan;
import com.medisphere.careplan_service.model.DoctorStatus;
import com.medisphere.careplan_service.repository.CarePlanRepository;

@ExtendWith(MockitoExtension.class)
class PatientCarePlanApiTest {

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

    private CarePlan createApprovedPlan(String carePlanId, String patientId, LocalDateTime createdAt) {
        CarePlan plan = new CarePlan();
        plan.setCarePlanId(carePlanId);
        plan.setPatientId(patientId);
        plan.setDoctorStatus(DoctorStatus.APPROVED);
        plan.setApprovedBy("doctor1");
        plan.setApprovedAt(createdAt);
        plan.setCreatedAt(createdAt);
        plan.setUpdatedAt(createdAt);
        plan.setMedications(List.of("Metformin 500mg", "Losartan 50mg"));
        plan.setDiet("Low Salt, Low Sugar");
        plan.setExercise("30 min walking");
        plan.setWaterIntake("3 Litres");
        plan.setSleepRecommendation("8 Hours");
        plan.setDoctorNotes("Approved notes");
        plan.setNextReview(LocalDate.now().plusDays(30));
        return plan;
    }

    @Test
    @DisplayName("1. Patient Latest Approved Care Plan — Returns latest APPROVED plan")
    void testGetLatestApprovedCarePlan() {
        CarePlan approvedPlan1 = createApprovedPlan("CP-APP-02", "P1001", LocalDateTime.now().minusDays(1));
        CarePlan approvedPlan2 = createApprovedPlan("CP-APP-01", "P1001", LocalDateTime.now().minusDays(10));

        when(repository.findByPatientIdAndDoctorStatusOrderByCreatedAtDesc("P1001", DoctorStatus.APPROVED))
                .thenReturn(List.of(approvedPlan1, approvedPlan2));

        CarePlan latest = service.getLatestApprovedCarePlan("P1001");

        assertNotNull(latest);
        assertEquals("CP-APP-02", latest.getCarePlanId());
        assertEquals(DoctorStatus.APPROVED, latest.getDoctorStatus());
        verify(repository).findByPatientIdAndDoctorStatusOrderByCreatedAtDesc("P1001", DoctorStatus.APPROVED);
    }

    @Test
    @DisplayName("2. Patient Approved History — Returns all APPROVED care plans sorted newest first")
    void testGetApprovedCarePlanHistory() {
        CarePlan approvedPlan1 = createApprovedPlan("CP-APP-02", "P1001", LocalDateTime.now().minusDays(1));
        CarePlan approvedPlan2 = createApprovedPlan("CP-APP-01", "P1001", LocalDateTime.now().minusDays(10));

        when(repository.findByPatientIdAndDoctorStatusOrderByCreatedAtDesc("P1001", DoctorStatus.APPROVED))
                .thenReturn(List.of(approvedPlan1, approvedPlan2));

        List<CarePlan> history = service.getApprovedCarePlanHistory("P1001");

        assertEquals(2, history.size());
        assertEquals("CP-APP-02", history.get(0).getCarePlanId());
        assertEquals("CP-APP-01", history.get(1).getCarePlanId());
    }

    @Test
    @DisplayName("3. Today Summary — Maps latest APPROVED plan to TodayCarePlanResponse DTO")
    void testGetTodayCarePlanSummary() {
        CarePlan approvedPlan = createApprovedPlan("CP-APP-03", "P1001", LocalDateTime.now());
        when(repository.findByPatientIdAndDoctorStatusOrderByCreatedAtDesc("P1001", DoctorStatus.APPROVED))
                .thenReturn(List.of(approvedPlan));

        TodayCarePlanResponse summary = service.getTodayCarePlanSummary("P1001");

        assertNotNull(summary);
        assertEquals("P1001", summary.getPatientId());
        assertEquals(List.of("Metformin 500mg", "Losartan 50mg"), summary.getMedications());
        assertEquals("Low Salt, Low Sugar", summary.getDiet());
        assertEquals("30 min walking", summary.getExercise());
        assertEquals("3 Litres", summary.getWaterIntake());
        assertEquals("8 Hours", summary.getSleepRecommendation());
        assertEquals("Approved notes", summary.getDoctorNotes());
        assertNotNull(summary.getNextReview());
    }

    @Test
    @DisplayName("4. No Approved Care Plan — Throws 404 CarePlanNotFoundException for latest approved")
    void testNoApprovedCarePlanThrows404() {
        when(repository.findByPatientIdAndDoctorStatusOrderByCreatedAtDesc("P1002", DoctorStatus.APPROVED))
                .thenReturn(Collections.emptyList());

        assertThrows(CarePlanNotFoundException.class, () -> {
            service.getLatestApprovedCarePlan("P1002");
        });
    }

    @Test
    @DisplayName("5. No Approved Care Plan History — Throws 404 CarePlanNotFoundException for history")
    void testNoApprovedCarePlanHistoryThrows404() {
        when(repository.findByPatientIdAndDoctorStatusOrderByCreatedAtDesc("P1002", DoctorStatus.APPROVED))
                .thenReturn(Collections.emptyList());

        assertThrows(CarePlanNotFoundException.class, () -> {
            service.getApprovedCarePlanHistory("P1002");
        });
    }

    @Test
    @DisplayName("6. No Approved Care Plan Today Summary — Throws 404 CarePlanNotFoundException for today summary")
    void testNoApprovedCarePlanTodaySummaryThrows404() {
        when(repository.findByPatientIdAndDoctorStatusOrderByCreatedAtDesc("P1002", DoctorStatus.APPROVED))
                .thenReturn(Collections.emptyList());

        assertThrows(CarePlanNotFoundException.class, () -> {
            service.getTodayCarePlanSummary("P1002");
        });
    }
}
