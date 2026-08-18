package com.medisphere.alert_service.service;

import java.util.ArrayList;
import java.util.List;

import com.medisphere.alert_service.dto.RuleViolation;
import com.medisphere.alert_service.dto.VitalMessage;
import com.medisphere.alert_service.model.AlertSeverity;

/**
 * Deterministic clinical rule engine.
 * Rules are evaluated in priority order; multiple violations per reading are supported.
 *
 * Rules:
 *  1. SpO2 < 90              → OXYGEN_ALERT          (CRITICAL)
 *  2. BP systolic > 180      → HYPERTENSION_CRISIS   (CRITICAL)
 *  3. HR > 140 AND age > 50  → POSSIBLE_AFIB         (CRITICAL) — composite rule
 *  4. HR > 130               → HIGH_HEART_RATE       (HIGH)
 *  5. Temperature > 39.0°C   → HIGH_TEMPERATURE      (HIGH)
 *
 * Note: Rule 3 (AFib) supersedes rule 4 when HR > 140 AND age > 50; both fire independently.
 * patientAge must be set on VitalMessage by AlertService before calling evaluate().
 */
public class ClinicalRuleEngine {

    public List<RuleViolation> evaluate(VitalMessage message) {
        List<RuleViolation> violations = new ArrayList<>();

        if (message == null) {
            return violations;
        }

        // Rule 1 — Oxygen Alert (CRITICAL)
        if (message.getSpo2() < 90) {
            violations.add(new RuleViolation(
                    "OXYGEN_ALERT",
                    AlertSeverity.CRITICAL,
                    "Oxygen saturation is critically low at " + message.getSpo2() + "%"
            ));
        }

        // Rule 2 — Hypertension Crisis (CRITICAL)
        if (message.getBpSystolic() > 180) {
            violations.add(new RuleViolation(
                    "HYPERTENSION_CRISIS",
                    AlertSeverity.CRITICAL,
                    "Systolic blood pressure is critically high at " + message.getBpSystolic() + " mmHg"
            ));
        }

        // Rule 3 — Possible AFib: HR > 140 AND patient age > 50 (CRITICAL composite rule)
        if (message.getHeartRate() > 140 && message.getPatientAge() > 50) {
            violations.add(new RuleViolation(
                    "POSSIBLE_AFIB",
                    AlertSeverity.CRITICAL,
                    "Possible Atrial Fibrillation: Heart rate " + message.getHeartRate()
                            + " bpm in patient aged " + message.getPatientAge()
                            + ". Immediate cardiology review required."
            ));
        }

        // Rule 4 — High Heart Rate (HIGH) — fires independently of AFib rule
        if (message.getHeartRate() > 130) {
            violations.add(new RuleViolation(
                    "HIGH_HEART_RATE",
                    AlertSeverity.HIGH,
                    "Heart rate is elevated at " + message.getHeartRate() + " bpm"
            ));
        }

        // Rule 5 — High Temperature (HIGH)
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
