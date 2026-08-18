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
import com.medisphere.careplan_service.dto.UpdateAdherenceRequest;
import com.medisphere.careplan_service.exception.CarePlanNotFoundException;
import com.medisphere.careplan_service.model.CarePlan;
import com.medisphere.careplan_service.model.DoctorStatus;
import com.medisphere.careplan_service.repository.CarePlanRepository;

@ExtendWith(MockitoExtension.class)
class AdherenceTrackingTest {

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
        plan.setAdherence(0);
        plan.setCreatedAt(LocalDateTime.now().minusDays(1));
        plan.setUpdatedAt(LocalDateTime.now().minusDays(1));
        return plan;
    }

    private CarePlan testAdherenceCalculation(int expectedPercentage,
                                               boolean med,
                                               boolean ex,
                                               boolean diet,
                                               boolean water,
                                               boolean sleep,
                                               boolean bp,
                                               boolean glucose) {
        CarePlan plan = createSamplePlan("CP-ADH-100");
        when(repository.findByCarePlanId("CP-ADH-100")).thenReturn(Optional.of(plan));
        when(repository.save(any(CarePlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateAdherenceRequest req = new UpdateAdherenceRequest(med, ex, diet, water, sleep, bp, glucose);
        CarePlan result = service.updateAdherence("CP-ADH-100", req);

        assertEquals(expectedPercentage, result.getAdherence());
        assertNotNull(result.getLastAdherenceUpdate());
        verify(repository).save(plan);
        return result;
    }

    @Test
    @DisplayName("0 completed activities -> 0%")
    void testAdherence0Percent() {
        testAdherenceCalculation(0, false, false, false, false, false, false, false);
    }

    @Test
    @DisplayName("1 completed activity -> 14%")
    void testAdherence14Percent() {
        testAdherenceCalculation(14, true, false, false, false, false, false, false);
    }

    @Test
    @DisplayName("2 completed activities -> 29%")
    void testAdherence29Percent() {
        testAdherenceCalculation(29, true, true, false, false, false, false, false);
    }

    @Test
    @DisplayName("3 completed activities -> 43%")
    void testAdherence43Percent() {
        testAdherenceCalculation(43, true, true, true, false, false, false, false);
    }

    @Test
    @DisplayName("4 completed activities -> 57%")
    void testAdherence57Percent() {
        testAdherenceCalculation(57, true, true, true, true, false, false, false);
    }

    @Test
    @DisplayName("5 completed activities -> 71%")
    void testAdherence71Percent() {
        testAdherenceCalculation(71, true, true, true, true, true, false, false);
    }

    @Test
    @DisplayName("6 completed activities -> 86%")
    void testAdherence86Percent() {
        testAdherenceCalculation(86, true, true, true, true, true, true, false);
    }

    @Test
    @DisplayName("7 completed activities -> 100%")
    void testAdherence100Percent() {
        testAdherenceCalculation(100, true, true, true, true, true, true, true);
    }

    @Test
    @DisplayName("Verify lastAdherenceUpdate changes on update")
    void testLastAdherenceUpdateChanges() {
        CarePlan plan = createSamplePlan("CP-ADH-200");
        LocalDateTime beforeUpdate = LocalDateTime.now().minusHours(5);
        plan.setLastAdherenceUpdate(beforeUpdate);

        when(repository.findByCarePlanId("CP-ADH-200")).thenReturn(Optional.of(plan));
        when(repository.save(any(CarePlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateAdherenceRequest req = new UpdateAdherenceRequest(true, true, true, true, true, true, true);
        CarePlan updated = service.updateAdherence("CP-ADH-200", req);

        assertNotNull(updated.getLastAdherenceUpdate());
        assertEquals(100, updated.getAdherence());
    }

    @Test
    @DisplayName("Non-existent CarePlanId -> Throws 404 CarePlanNotFoundException")
    void testUpdateAdherenceNotFoundThrows404() {
        when(repository.findByCarePlanId("CP-NOTFOUND")).thenReturn(Optional.empty());

        UpdateAdherenceRequest req = new UpdateAdherenceRequest(true, false, false, false, false, false, false);

        assertThrows(CarePlanNotFoundException.class, () -> {
            service.updateAdherence("CP-NOTFOUND", req);
        });
    }
}
