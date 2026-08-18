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
import com.medisphere.careplan_service.dto.AddCommentRequest;
import com.medisphere.careplan_service.dto.CommentResponse;
import com.medisphere.careplan_service.exception.CarePlanNotFoundException;
import com.medisphere.careplan_service.model.CarePlan;
import com.medisphere.careplan_service.model.CarePlanComment;
import com.medisphere.careplan_service.model.DoctorStatus;
import com.medisphere.careplan_service.repository.CarePlanRepository;

@ExtendWith(MockitoExtension.class)
class ProviderCollaborationTest {

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

    private CarePlan createSamplePlan(String carePlanId) {
        CarePlan plan = new CarePlan();
        plan.setCarePlanId(carePlanId);
        plan.setPatientId("P1001");
        plan.setDoctorStatus(DoctorStatus.APPROVED);
        plan.setCreatedAt(LocalDateTime.now().minusDays(1));
        plan.setUpdatedAt(LocalDateTime.now().minusDays(1));
        return plan;
    }

    @Test
    @DisplayName("1. Add Doctor Comment — Role DOCTOR accepted, comment appended")
    void testAddDoctorComment() {
        CarePlan plan = createSamplePlan("CP-CMT-101");
        when(repository.findByCarePlanId("CP-CMT-101")).thenReturn(Optional.of(plan));
        when(repository.save(any(CarePlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AddCommentRequest req = new AddCommentRequest("doctor1", "DOCTOR", "Continue medication for another month.");
        CommentResponse resp = service.addComment("CP-CMT-101", req);

        assertNotNull(resp);
        assertEquals("doctor1", resp.getAuthor());
        assertEquals("DOCTOR", resp.getAuthorRole());
        assertEquals("Continue medication for another month.", resp.getMessage());
        assertNotNull(resp.getCommentId());
        assertNotNull(resp.getCreatedAt());
        assertEquals(1, plan.getComments().size());
        verify(repository).save(plan);
    }

    @Test
    @DisplayName("2. Add Nurse Comment — Role NURSE accepted, comment appended")
    void testAddNurseComment() {
        CarePlan plan = createSamplePlan("CP-CMT-102");
        when(repository.findByCarePlanId("CP-CMT-102")).thenReturn(Optional.of(plan));
        when(repository.save(any(CarePlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AddCommentRequest req = new AddCommentRequest("nurse1", "NURSE", "Patient vital signs checked and stable.");
        CommentResponse resp = service.addComment("CP-CMT-102", req);

        assertNotNull(resp);
        assertEquals("nurse1", resp.getAuthor());
        assertEquals("NURSE", resp.getAuthorRole());
        assertEquals("Patient vital signs checked and stable.", resp.getMessage());
        assertEquals(1, plan.getComments().size());
    }

    @Test
    @DisplayName("3. Add Patient Comment — Role PATIENT accepted, comment appended")
    void testAddPatientComment() {
        CarePlan plan = createSamplePlan("CP-CMT-103");
        when(repository.findByCarePlanId("CP-CMT-103")).thenReturn(Optional.of(plan));
        when(repository.save(any(CarePlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AddCommentRequest req = new AddCommentRequest("patient1", "PATIENT", "Completed morning walking session.");
        CommentResponse resp = service.addComment("CP-CMT-103", req);

        assertNotNull(resp);
        assertEquals("patient1", resp.getAuthor());
        assertEquals("PATIENT", resp.getAuthorRole());
        assertEquals("Completed morning walking session.", resp.getMessage());
        assertEquals(1, plan.getComments().size());
    }

    @Test
    @DisplayName("4. Invalid Role — Throws 400 IllegalArgumentException for unknown role")
    void testInvalidRoleThrows400() {
        AddCommentRequest req = new AddCommentRequest("user1", "ADMIN", "Some message");

        assertThrows(IllegalArgumentException.class, () -> {
            service.addComment("CP-CMT-104", req);
        });
    }

    @Test
    @DisplayName("5. Blank Message — Throws 400 IllegalArgumentException for empty message")
    void testBlankMessageThrows400() {
        AddCommentRequest req = new AddCommentRequest("doctor1", "DOCTOR", "   ");

        assertThrows(IllegalArgumentException.class, () -> {
            service.addComment("CP-CMT-105", req);
        });
    }

    @Test
    @DisplayName("6. Comment Ordering — Comments returned sorted oldest first (chronological)")
    void testCommentOrderingOldestFirst() {
        CarePlan plan = createSamplePlan("CP-CMT-106");

        CarePlanComment c1 = new CarePlanComment("CMT-1", "doctor1", "DOCTOR", "First comment", LocalDateTime.now().minusHours(3));
        CarePlanComment c2 = new CarePlanComment("CMT-2", "nurse1", "NURSE", "Second comment", LocalDateTime.now().minusHours(2));
        CarePlanComment c3 = new CarePlanComment("CMT-3", "patient1", "PATIENT", "Third comment", LocalDateTime.now().minusHours(1));

        plan.getComments().addAll(List.of(c3, c1, c2)); // Added out of order

        when(repository.findByCarePlanId("CP-CMT-106")).thenReturn(Optional.of(plan));

        List<CommentResponse> comments = service.getComments("CP-CMT-106");

        assertEquals(3, comments.size());
        assertEquals("CMT-1", comments.get(0).getCommentId());
        assertEquals("CMT-2", comments.get(1).getCommentId());
        assertEquals("CMT-3", comments.get(2).getCommentId());
    }

    @Test
    @DisplayName("7. Non-existent CarePlanId -> Throws 404 CarePlanNotFoundException")
    void testCommentNotFoundThrows404() {
        when(repository.findByCarePlanId("CP-NOTFOUND")).thenReturn(Optional.empty());

        AddCommentRequest req = new AddCommentRequest("doctor1", "DOCTOR", "Valid comment");

        assertThrows(CarePlanNotFoundException.class, () -> {
            service.addComment("CP-NOTFOUND", req);
        });
    }
}
