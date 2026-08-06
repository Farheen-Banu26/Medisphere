package com.infosys.vitals_service.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.infosys.vitals_service.dto.VitalMessage;
import com.infosys.vitals_service.kafka.KafkaProducer;
import com.infosys.vitals_service.model.Vital;
import com.infosys.vitals_service.repository.VitalsRepository;

@Service
public class VitalsService {

    @Autowired
    private VitalsRepository repository;

    @Autowired
    private KafkaProducer kafkaProducer;

    private final RestTemplate restTemplate = new RestTemplate();

    // Add Vitals
    public String addVitals(Vital vital) {

        // Normalize the temperature to Celsius before saving and publishing
        double rawTemperature = vital.getTemperature();
        double normalizedTemperature = normalizeTemperature(rawTemperature);
        vital.setTemperature(normalizedTemperature);

        System.out.println("VitalsService: vitals MongoDB temperature=" + normalizedTemperature + " (raw input=" + rawTemperature + ")");

        // Save to MongoDB
        repository.save(vital);

        // Create Kafka DTO
        VitalMessage message = new VitalMessage(
                vital.getPatientId(),
                vital.getHeartRate(),
                vital.getBpSystolic(),
                vital.getBpDiastolic(),
                normalizedTemperature,
                vital.getSpo2(),
                vital.getSteps(),
                vital.getSleepHours());

        // Send to Kafka
        kafkaProducer.sendMessage(message);

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("action", "RECORD_VITALS");
            payload.put("user", "system");
            payload.put("role", "SYSTEM");
            payload.put("patientId", vital.getPatientId());
            payload.put("status", "SUCCESS");
            payload.put("details", "Vitals recorded successfully");

            restTemplate.postForEntity(
                    "http://localhost:8994/api/audit/logs",
                    payload,
                    String.class);

        } catch (RuntimeException ex) {
            System.out.println("Audit log write failed: " + ex.getMessage());
        }

        return "Vitals Saved Successfully";
    }

    // Get All Vitals
    public List<Vital> getAllVitals() {
        return repository.findAll();
    }

    // Get Patient Vitals
    public List<Vital> getVitalsByPatient(String patientId) {
        return repository.findByPatientIdIgnoreCase(patientId.trim());
    }

    // Get Latest Vitals
    public Vital getLatestVitals(String patientId) {
        return repository.findTopByPatientIdOrderByRecordedAtDesc(patientId.trim());
    }

    // Delete Vitals
    public String deleteVitals(String id) {
        repository.deleteById(id);
        return "Vitals Deleted Successfully";
    }

    private double normalizeTemperature(double temperature) {
        if (temperature > 45.0) {
            double celsius = (temperature - 32.0) * 5.0 / 9.0;
            return Math.round(celsius * 10.0) / 10.0;
        }
        return temperature;
    }
}