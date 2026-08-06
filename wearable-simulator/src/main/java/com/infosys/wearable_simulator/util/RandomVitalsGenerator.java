package com.infosys.wearable_simulator.util;

import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

import com.infosys.wearable_simulator.model.VitalMessage;

public class RandomVitalsGenerator {

    public VitalMessage generateVitals(String patientId) {
        ThreadLocalRandom random = ThreadLocalRandom.current();

        int heartRate = random.nextInt(65, 96);
        int bpSystolic = random.nextInt(110, 131);
        int bpDiastolic = random.nextInt(70, 86);
        int spo2 = random.nextInt(96, 101);
        double temperature = Math.round((36.5 + random.nextDouble() * (37.5 - 36.5)) * 10.0) / 10.0;
        int respiration = random.nextInt(12, 21);
        int steps = random.nextInt(1000, 12001);
        int sleepHours = random.nextInt(5, 10);
        LocalDateTime recordedAt = LocalDateTime.now();

        return new VitalMessage(
                patientId,
                heartRate,
                bpSystolic,
                bpDiastolic,
                spo2,
                temperature,
                respiration,
                steps,
                sleepHours,
                recordedAt
        );
    }
}
