package com.infosys.wearable_simulator.util;

import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

import com.infosys.wearable_simulator.model.VitalMessage;

/**
 * Generates realistic vital-signs with occasional controlled abnormal events
 * that are guaranteed to exceed ClinicalRuleEngine thresholds.
 *
 * Abnormal thresholds (must match ClinicalRuleEngine):
 *   HR        > 130  → HIGH_HEART_RATE    | > 140 → POSSIBLE_AFIB (age-based in rule engine)
 *   BPsystolic> 180  → HYPERTENSION_CRISIS
 *   SpO2      < 90   → OXYGEN_ALERT
 *   Temp      > 39.0 → HIGH_TEMPERATURE
 *
 * Abnormal events occur ~8% of the time (1 in ~12 readings).
 */
public class RandomVitalsGenerator {

    private static class PatientState {
        int heartRate = 74;
        int bpSystolic = 120;
        int bpDiastolic = 80;
        int spo2 = 98;
        double temperature = 36.7;
        int respirationRate = 16;
        int steps = 3000;
        int sleepHours = 7;
    }

    private final java.util.Map<String, PatientState> patientStates =
            new java.util.concurrent.ConcurrentHashMap<>();

    public VitalMessage generateVitals(String patientId) {
        ThreadLocalRandom random = ThreadLocalRandom.current();
        PatientState state = patientStates.computeIfAbsent(patientId, k -> new PatientState());

        // 8% chance of an intentional abnormal reading that WILL cross a rule threshold
        boolean triggerAlert = random.nextDouble() < 0.08;

        int heartRate;
        int bpSystolic;
        int bpDiastolic;
        int spo2;
        double temperature;
        int respirationRate;

        if (triggerAlert) {
            // Rotate through 4 alert types so each gets tested
            int alertType = random.nextInt(4);
            switch (alertType) {
                case 0 -> {
                    // Tachycardia — HR 131–155, crosses HR > 130 rule
                    // Also crosses HR > 140 if value >= 141 (AFib rule for age > 50)
                    heartRate = random.nextInt(131, 156);
                    bpSystolic = state.bpSystolic;
                    bpDiastolic = state.bpDiastolic;
                    spo2 = state.spo2;
                    temperature = state.temperature;
                    respirationRate = random.nextInt(18, 24);
                }
                case 1 -> {
                    // Hypoxemia — SpO2 85–89, crosses SpO2 < 90 rule
                    heartRate = state.heartRate;
                    bpSystolic = state.bpSystolic;
                    bpDiastolic = state.bpDiastolic;
                    spo2 = random.nextInt(85, 90);
                    temperature = state.temperature;
                    respirationRate = random.nextInt(20, 28);
                }
                case 2 -> {
                    // Hypertensive crisis — BP systolic 181–200, crosses BP > 180 rule
                    heartRate = state.heartRate;
                    bpSystolic = random.nextInt(181, 201);
                    bpDiastolic = random.nextInt(105, 120);
                    spo2 = state.spo2;
                    temperature = state.temperature;
                    respirationRate = state.respirationRate;
                }
                default -> {
                    // High fever — temperature 39.5–40.5, crosses temp > 39.0 rule
                    heartRate = state.heartRate;
                    bpSystolic = state.bpSystolic;
                    bpDiastolic = state.bpDiastolic;
                    spo2 = state.spo2;
                    temperature = Math.round((39.5 + random.nextDouble()) * 10.0) / 10.0;
                    respirationRate = random.nextInt(20, 26);
                }
            }
        } else {
            // Realistic step-wise dynamic changes within normal range
            int hrDelta = random.nextInt(-3, 4);
            state.heartRate = Math.max(62, Math.min(96, state.heartRate + hrDelta));
            heartRate = state.heartRate;

            int sysDelta = random.nextInt(-2, 3);
            state.bpSystolic = Math.max(110, Math.min(134, state.bpSystolic + sysDelta));
            bpSystolic = state.bpSystolic;

            int diaDelta = random.nextInt(-2, 3);
            state.bpDiastolic = Math.max(70, Math.min(88, state.bpDiastolic + diaDelta));
            bpDiastolic = state.bpDiastolic;

            int spo2Delta = random.nextInt(-1, 2);
            state.spo2 = Math.max(95, Math.min(100, state.spo2 + spo2Delta));
            spo2 = state.spo2;

            double tempDelta = (random.nextDouble() * 0.4) - 0.2;
            state.temperature = Math.round(
                    Math.max(36.2, Math.min(37.4, state.temperature + tempDelta)) * 10.0) / 10.0;
            temperature = state.temperature;

            state.respirationRate = Math.max(12, Math.min(20,
                    state.respirationRate + random.nextInt(-1, 2)));
            respirationRate = state.respirationRate;

            state.steps += random.nextInt(5, 25);
        }

        return new VitalMessage(
                patientId,
                heartRate,
                bpSystolic,
                bpDiastolic,
                spo2,
                temperature,
                respirationRate,
                state.steps,
                state.sleepHours,
                LocalDateTime.now()
        );
    }
}
