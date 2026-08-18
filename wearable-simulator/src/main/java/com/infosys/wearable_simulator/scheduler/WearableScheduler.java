package com.infosys.wearable_simulator.scheduler;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.infosys.wearable_simulator.model.VitalMessage;
import com.infosys.wearable_simulator.service.PatientService;
import com.infosys.wearable_simulator.service.WearableService;
import com.infosys.wearable_simulator.util.RandomVitalsGenerator;

@Component
@EnableScheduling
public class WearableScheduler {

    private static final Logger logger = LoggerFactory.getLogger(WearableScheduler.class);
    private final WearableService wearableService;
    private final PatientService patientService;
    private final RandomVitalsGenerator vitalsGenerator;
    private volatile boolean running = true;

    public WearableScheduler(WearableService wearableService, PatientService patientService) {
        this.wearableService = wearableService;
        this.patientService = patientService;
        this.vitalsGenerator = new RandomVitalsGenerator();
    }

    @Scheduled(fixedRate = 5000)
    public void publishVitalsForConfiguredPatients() {
        if (!running) {
            return;
        }

        var patientIds = patientService.fetchPatientIds();
        if (patientIds.isEmpty()) {
            logger.warn("No patients found to publish vitals");
            return;
        }

        patientIds.forEach(patientId -> {
            VitalMessage vitals = vitalsGenerator.generateVitals(patientId);
            logger.info("Generated vitals for patient {}", patientId);
            boolean success = wearableService.sendVitals(vitals);
            if (!success) {
                logger.warn("Failed to send vitals for patient {}", patientId);
            }
        });
    }

    public void start() {
        running = true;
        logger.info("Wearable simulator scheduler started");
    }

    public void stop() {
        running = false;
        logger.info("Wearable simulator scheduler stopped");
    }

    public boolean isRunning() {
        return running;
    }

    public VitalMessage generateVitals(String patientId) {
        return vitalsGenerator.generateVitals(patientId);
    }
}
