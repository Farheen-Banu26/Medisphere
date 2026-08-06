package com.medisphere.alert_service.service;

import java.util.ArrayList;
import java.util.List;

import com.medisphere.alert_service.dto.RuleViolation;
import com.medisphere.alert_service.dto.VitalMessage;
import com.medisphere.alert_service.model.AlertSeverity;

public class ClinicalRuleEngine {

    public List<RuleViolation> evaluate(VitalMessage message) {
        List<RuleViolation> violations = new ArrayList<>();

        if (message == null) {
            return violations;
        }

        if (message.getSpo2() < 90) {
            violations.add(new RuleViolation(
                    "OXYGEN_ALERT",
                    AlertSeverity.CRITICAL,
                    "Oxygen saturation is critically low at " + message.getSpo2() + "%"
            ));
        }

        if (message.getBpSystolic() > 180) {
            violations.add(new RuleViolation(
                    "HYPERTENSION_CRISIS",
                    AlertSeverity.CRITICAL,
                    "Systolic blood pressure is critically high at " + message.getBpSystolic() + " mmHg"
            ));
        }

        if (message.getHeartRate() > 130) {
            violations.add(new RuleViolation(
                    "HIGH_HEART_RATE",
                    AlertSeverity.HIGH,
                    "Heart rate is elevated at " + message.getHeartRate() + " bpm"
            ));
        }

        if (message.getTemperature() > 39.0) {
            violations.add(new RuleViolation(
                    "HIGH_TEMPERATURE",
                    AlertSeverity.HIGH,
                    "Temperature is elevated at " + message.getTemperature() + "°C"
            ));
        }

        return violations;
    }
}
