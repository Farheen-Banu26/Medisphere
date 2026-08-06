package com.medisphere.alert_service.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

import com.medisphere.alert_service.dto.VitalMessage;

class ClinicalRuleEngineTest {

    private final ClinicalRuleEngine engine = new ClinicalRuleEngine();

    @Test
    void shouldCreateMultipleViolationsForSevereVitals() {
        VitalMessage message = new VitalMessage();
        message.setPatientId("P001");
        message.setHeartRate(145);
        message.setBpSystolic(190);
        message.setTemperature(40.2);
        message.setSpo2(87);

        var violations = engine.evaluate(message);

        assertEquals(4, violations.size());
        assertTrue(violations.stream().anyMatch(v -> "OXYGEN_ALERT".equals(v.getType())));
        assertTrue(violations.stream().anyMatch(v -> "HYPERTENSION_CRISIS".equals(v.getType())));
        assertTrue(violations.stream().anyMatch(v -> "HIGH_HEART_RATE".equals(v.getType())));
        assertTrue(violations.stream().anyMatch(v -> "HIGH_TEMPERATURE".equals(v.getType())));
    }
}
