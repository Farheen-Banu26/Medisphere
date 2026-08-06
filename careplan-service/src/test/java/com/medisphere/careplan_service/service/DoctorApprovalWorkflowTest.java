package com.medisphere.careplan_service.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
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
import com.medisphere.careplan_service.dto.DoctorApproveRequest;
import com.medisphere.careplan_service.dto.DoctorRejectRequest;
import com.medisphere.careplan_service.dto.UpdateDoctorNotesRequest;
import com.medisphere.careplan_service.exception.CarePlanNotFoundException;
import com.medisphere.careplan_service.exception.InvalidCarePlanStatusException;
import com.medisphere.careplan_service.model.CarePlan;
import com.medisphere.careplan_service.model.DoctorStatus;
import com.medisphere.careplan_service.repository.CarePlanRepository;

@ExtendWith(MockitoExtension.class)
class DoctorApprovalWorkflowTest {

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

    private CarePlan createSamplePlan(String carePlanId, DoctorStatus status) {
        CarePlan plan = new CarePlan();
        plan.setCarePlanId(carePlanId);
        plan.setPatientId("P1001");
        plan.setDoctorStatus(status);
        plan.setCreatedAt(LocalDateTime.now().minusHours(2));
        plan.setUpdatedAt(LocalDateTime.now().minusHours(2));
        return plan;
    }

    @Test
    @DisplayName("1. Approve PENDING Care Plan — Status becomes APPROVED, fields populated")
    void testApprovePendingCarePlan() {
        CarePlan plan = createSamplePlan("CP-101", DoctorStatus.PENDING);
        when(repository.findByCarePlanId("CP-101")).thenReturn(Optional.of(plan));
        when(repository.save(any(CarePlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DoctorApproveRequest req = new DoctorApproveRequest("doctor1", "Approved after review");
        CarePlan approved = service.approveCarePlanByDoctor("CP-101", req);

        assertEquals(DoctorStatus.APPROVED, approved.getDoctorStatus());
        assertEquals("doctor1", approved.getApprovedBy());
        assertNotNull(approved.getApprovedAt());
        assertEquals("doctor1", approved.getLastModifiedBy());
        assertNotNull(approved.getLastModifiedAt());
        assertEquals("Approved after review", approved.getDoctorNotes());
        verify(repository).save(plan);
    }

    @Test
    @DisplayName("2. Reject PENDING Care Plan — Status becomes REJECTED, reason populated")
    void testRejectPendingCarePlan() {
        CarePlan plan = createSamplePlan("CP-102", DoctorStatus.PENDING);
        when(repository.findByCarePlanId("CP-102")).thenReturn(Optional.of(plan));
        when(repository.save(any(CarePlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DoctorRejectRequest req = new DoctorRejectRequest("doctor1", "Incomplete patient history");
        CarePlan rejected = service.rejectCarePlanByDoctor("CP-102", req);

        assertEquals(DoctorStatus.REJECTED, rejected.getDoctorStatus());
        assertEquals("doctor1", rejected.getRejectedBy());
        assertNotNull(rejected.getRejectedAt());
        assertEquals("Incomplete patient history", rejected.getRejectedReason());
        assertEquals("doctor1", rejected.getLastModifiedBy());
        assertNotNull(rejected.getLastModifiedAt());
        verify(repository).save(plan);
    }

    @Test
    @DisplayName("3. Repeated Approve — Idempotent, should not throw exception")
    void testRepeatedApproveIsIdempotent() {
        CarePlan plan = createSamplePlan("CP-103", DoctorStatus.APPROVED);
        plan.setApprovedBy("doctor1");
        plan.setApprovedAt(LocalDateTime.now().minusHours(1));

        when(repository.findByCarePlanId("CP-103")).thenReturn(Optional.of(plan));
        when(repository.save(any(CarePlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DoctorApproveRequest req = new DoctorApproveRequest("doctor1", "Updated notes on re-approve");
        CarePlan result = service.approveCarePlanByDoctor("CP-103", req);

        assertEquals(DoctorStatus.APPROVED, result.getDoctorStatus());
        assertEquals("Updated notes on re-approve", result.getDoctorNotes());
        assertEquals("doctor1", result.getLastModifiedBy());
        verify(repository).save(plan);
    }

    @Test
    @DisplayName("4. Repeated Reject — Idempotent, should not throw exception")
    void testRepeatedRejectIsIdempotent() {
        CarePlan plan = createSamplePlan("CP-104", DoctorStatus.REJECTED);
        plan.setRejectedBy("doctor1");
        plan.setRejectedReason("Initial reason");

        when(repository.findByCarePlanId("CP-104")).thenReturn(Optional.of(plan));
        when(repository.save(any(CarePlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DoctorRejectRequest req = new DoctorRejectRequest("doctor1", "Updated rejection reason");
        CarePlan result = service.rejectCarePlanByDoctor("CP-104", req);

        assertEquals(DoctorStatus.REJECTED, result.getDoctorStatus());
        assertEquals("Updated rejection reason", result.getRejectedReason());
        assertEquals("doctor1", result.getLastModifiedBy());
        verify(repository).save(plan);
    }

    @Test
    @DisplayName("5. Invalid Transition: REJECTED to APPROVED throws 409 Conflict exception")
    void testRejectedToApprovedThrowsException() {
        CarePlan plan = createSamplePlan("CP-105", DoctorStatus.REJECTED);
        when(repository.findByCarePlanId("CP-105")).thenReturn(Optional.of(plan));

        DoctorApproveRequest req = new DoctorApproveRequest("doctor1", "Trying to approve rejected plan");

        assertThrows(InvalidCarePlanStatusException.class, () -> {
            service.approveCarePlanByDoctor("CP-105", req);
        });
    }

    @Test
    @DisplayName("6. Invalid Transition: APPROVED to REJECTED throws 409 Conflict exception")
    void testApprovedToRejectedThrowsException() {
        CarePlan plan = createSamplePlan("CP-106", DoctorStatus.APPROVED);
        when(repository.findByCarePlanId("CP-106")).thenReturn(Optional.of(plan));

        DoctorRejectRequest req = new DoctorRejectRequest("doctor1", "Trying to reject approved plan");

        assertThrows(InvalidCarePlanStatusException.class, () -> {
            service.rejectCarePlanByDoctor("CP-106", req);
        });
    }

    @Test
    @DisplayName("7. Doctor Notes Update — Updates only notes and modification timestamps")
    void testUpdateDoctorNotes() {
        CarePlan plan = createSamplePlan("CP-107", DoctorStatus.PENDING);
        plan.setDoctorNotes("Initial notes");

        when(repository.findByCarePlanId("CP-107")).thenReturn(Optional.of(plan));
        when(repository.save(any(CarePlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateDoctorNotesRequest req = new UpdateDoctorNotesRequest("Patient should reduce sugar intake.", "doctor2");
        CarePlan updated = service.updateDoctorNotes("CP-107", req);

        assertEquals("Patient should reduce sugar intake.", updated.getDoctorNotes());
        assertEquals("doctor2", updated.getLastModifiedBy());
        assertNotNull(updated.getLastModifiedAt());
        verify(repository).save(plan);
    }

    @Test
    @DisplayName("8. Pending List — Retrieves all care plans with doctorStatus PENDING")
    void testGetPendingCarePlans() {
        CarePlan plan1 = createSamplePlan("CP-201", DoctorStatus.PENDING);
        CarePlan plan2 = createSamplePlan("CP-202", DoctorStatus.PENDING);

        when(repository.findByDoctorStatusOrderByCreatedAtDesc(DoctorStatus.PENDING))
                .thenReturn(List.of(plan1, plan2));

        List<CarePlan> pendingList = service.getPendingCarePlans();

        assertEquals(2, pendingList.size());
        assertEquals("CP-201", pendingList.get(0).getCarePlanId());
        assertEquals("CP-202", pendingList.get(1).getCarePlanId());
        verify(repository).findByDoctorStatusOrderByCreatedAtDesc(DoctorStatus.PENDING);
    }

    @Test
    @DisplayName("9. Care Plan Not Found — Throws 404 CarePlanNotFoundException")
    void testCarePlanNotFoundThrowsException() {
        when(repository.findByCarePlanId("CP-999")).thenReturn(Optional.empty());

        DoctorApproveRequest req = new DoctorApproveRequest("doctor1", "Notes");

        assertThrows(CarePlanNotFoundException.class, () -> {
            service.approveCarePlanByDoctor("CP-999", req);
        });
    }
}
