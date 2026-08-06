package com.infosys.health_twin_service.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.infosys.health_twin_service.model.HealthTwin;
import com.infosys.health_twin_service.repository.HealthTwinRepository;

class HealthTwinServiceTest {

    @Test
    void getTwinCreatesDefaultTwinWhenMissing() {
        HealthTwinRepository repository = mock(HealthTwinRepository.class);
        when(repository.findByPatientIdIgnoreCase("P123")).thenReturn(Optional.empty());
        when(repository.save(any(HealthTwin.class))).thenAnswer(invocation -> invocation.getArgument(0));

        HealthTwinService service = new HealthTwinService();
        ReflectionTestUtils.setField(service, "repository", repository);

        HealthTwin twin = service.getTwin("P123");

        assertNotNull(twin);
        assertEquals("P123", twin.getPatientId());
        assertEquals(0.0, twin.getRiskScore());
        assertEquals(100.0, twin.getHealthScore());
        assertEquals(0.0, twin.getBmi());
    }

    @Test
    void createTwinComputesBmiAndStoresBloodPressureFields() {
        HealthTwinRepository repository = mock(HealthTwinRepository.class);
        when(repository.findByPatientIdIgnoreCase("P1002")).thenReturn(Optional.empty());
        when(repository.save(any(HealthTwin.class))).thenAnswer(invocation -> {
            HealthTwin twin = invocation.getArgument(0);
            when(repository.findByPatientIdIgnoreCase("P1002")).thenReturn(Optional.of(twin));
            return twin;
        });

        HealthTwinService service = new HealthTwinService();
        ReflectionTestUtils.setField(service, "repository", repository);

        HealthTwin input = new HealthTwin();
        input.setPatientId("P1002");
        input.setHeight(180.0);
        input.setWeight(75.0);
        input.setSystolicBP(120);
        input.setDiastolicBP(80);
        input.setAge(35);
        input.setGender("Male");

        String result = service.createTwin(input);

        assertEquals("Health Twin Created Successfully", result);
        HealthTwin twin = service.getTwin("P1002");
        assertEquals(23.1, twin.getBmi());
        assertEquals(120, twin.getSystolicBP());
        assertEquals(80, twin.getDiastolicBP());
        assertEquals("120/80", twin.getBloodPressure());
    }
}
