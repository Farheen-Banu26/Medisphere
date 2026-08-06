package com.medisphere.alert_service.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.medisphere.alert_service.client.FlaskClient;
import com.medisphere.alert_service.client.HealthTwinClient;
import com.medisphere.alert_service.client.PatientClient;
import com.medisphere.alert_service.dto.AlertEvent;
import com.medisphere.alert_service.dto.FlaskRequest;
import com.medisphere.alert_service.dto.HealthTwinDTO;
import com.medisphere.alert_service.dto.PatientDTO;
import com.medisphere.alert_service.dto.RuleViolation;
import com.medisphere.alert_service.dto.VitalMessage;
import com.medisphere.alert_service.exception.AlertNotFoundException;
import com.medisphere.alert_service.exception.InvalidAcknowledgementException;
import com.medisphere.alert_service.exception.InvalidLifecycleTransitionException;
import com.medisphere.alert_service.kafka.AlertKafkaProducer;
import com.medisphere.alert_service.model.Alert;
import com.medisphere.alert_service.model.AlertStatus;
import com.medisphere.alert_service.repository.AlertRepository;

@Service
public class AlertService {

    private static final Logger logger = LoggerFactory.getLogger(AlertService.class);

    private final AlertRepository repository;
    private final ClinicalRuleEngine ruleEngine;
    private final AlertKafkaProducer kafkaProducer;
    private final PatientClient patientClient;
    private final HealthTwinClient healthTwinClient;
    private final FlaskClient flaskClient;

    public AlertService(AlertRepository repository, AlertKafkaProducer kafkaProducer,
                        PatientClient patientClient, HealthTwinClient healthTwinClient, FlaskClient flaskClient) {
        this.repository = repository;
        this.kafkaProducer = kafkaProducer;
        this.patientClient = patientClient;
        this.healthTwinClient = healthTwinClient;
        this.flaskClient = flaskClient;
        this.ruleEngine = new ClinicalRuleEngine();
    }

    public void processVitals(VitalMessage message) {
        if (message == null || message.getPatientId() == null || message.getPatientId().isBlank()) {
            return;
        }

        logger.info("Received vitals for patient {}", message.getPatientId());

        List<RuleViolation> violations = ruleEngine.evaluate(message);
        for (RuleViolation violation : violations) {
            logger.info("Rule violation detected: {}", violation.getType());
            if (hasActiveAlert(message.getPatientId(), violation.getType())) {
                logger.info("Duplicate active {} alert exists for {} - skipping", violation.getType(), message.getPatientId());
                continue;
            }

            Alert alert = new Alert();
            alert.setAlertId("ALT-" + UUID.randomUUID().toString().toUpperCase());
            alert.setPatientId(message.getPatientId());
            alert.setType(violation.getType());
            alert.setSeverity(violation.getSeverity());
            alert.setMessage(violation.getMessage());
            alert.setSource("CLINICAL_RULE_ENGINE");
            alert.setStatus(AlertStatus.NEW);
            alert.setHeartRate(message.getHeartRate());
            alert.setBpSystolic(message.getBpSystolic());
            alert.setBpDiastolic(message.getBpDiastolic());
            alert.setSpo2(message.getSpo2());
            alert.setTemperature(message.getTemperature());
            alert.setCreatedAt(LocalDateTime.now());

            // Enrich alert with AI Prediction
            enrichAlertWithAI(alert, message);

            repository.save(alert);
            logger.info("Alert created: {}", alert.getAlertId());

            if (kafkaProducer != null) {
                AlertEvent event = AlertEvent.fromAlert(alert);
                kafkaProducer.sendAlertEvent(event);
            }
        }
    }

    private void enrichAlertWithAI(Alert alert, VitalMessage message) {
        try {
            String patientId = alert.getPatientId();
            logger.info("Fetching patient and twin data for AI enrichment for patient {}", patientId);

            PatientDTO patient = patientClient.getPatient(patientId);
            HealthTwinDTO twin = healthTwinClient.getHealthTwin(patientId);

            if (patient == null || twin == null) {
                logger.warn("Missing patient or twin data for {}. Falling back to rules only.", patientId);
                return;
            }

            Map<String, Object> features = new LinkedHashMap<>();
            features.put("age", resolveAge(patient, twin));
            features.put("gender", normalizeGender(resolveGender(patient, twin)));
            features.put("height", defaultNumeric(twin.height()));
            features.put("weight", defaultNumeric(twin.weight()));
            features.put("bmi", defaultNumeric(twin.bmi()));
            features.put("heartRate", message.getHeartRate());
            features.put("systolicBP", message.getBpSystolic());
            features.put("diastolicBP", message.getBpDiastolic());
            features.put("oxygen", message.getSpo2());
            features.put("temperature", message.getTemperature());
            features.put("steps", message.getSteps());
            features.put("sleepHours", message.getSleepHours());
            features.put("cholesterol", defaultNumeric(twin.cholesterol()));
            features.put("bloodGlucose", defaultNumeric(twin.bloodGlucose()));
            features.put("hbA1c", defaultNumeric(twin.hbA1c()));
            features.put("smokingHistory", defaultYesNo(twin.smokingHistory()));
            features.put("familyHistory", defaultYesNo(twin.familyHistory()));

            FlaskRequest request = new FlaskRequest(features);
            Map<String, Object> flaskResponse = flaskClient.predict(request);

            if ("SUCCESS".equals(flaskResponse.get("status"))) {
                Map<String, Object> heartDisease = (Map<String, Object>) flaskResponse.get("heartDisease");
                Map<String, Object> diabetes = (Map<String, Object>) flaskResponse.get("diabetes");

                double heartConf = heartDisease != null && heartDisease.get("confidence") != null ? (double) heartDisease.get("confidence") : 0.0;
                double diabetesConf = diabetes != null && diabetes.get("confidence") != null ? (double) diabetes.get("confidence") : 0.0;

                String predictionLabel;
                String riskLevel;
                double confidence;

                if (heartConf >= diabetesConf) {
                    predictionLabel = "Possible Heart Disease";
                    riskLevel = heartDisease != null ? (String) heartDisease.get("prediction") : "Low Risk";
                    confidence = heartConf;
                } else {
                    predictionLabel = "Possible Diabetes";
                    riskLevel = diabetes != null ? (String) diabetes.get("prediction") : "Low Risk";
                    confidence = diabetesConf;
                }

                alert.setPrediction(predictionLabel);
                alert.setRisk(riskLevel);
                alert.setConfidence(confidence);
                alert.setAiRecommendation("Consult specialist based on high AI confidence score.");
                alert.setPredictionTimestamp(LocalDateTime.now());

                logger.info("AI enrichment successful: {} - Risk: {} ({}%)", predictionLabel, riskLevel, confidence);
            } else {
                logger.warn("Flask AI service returned non-success status. Falling back to rules only.");
            }

        } catch (Exception ex) {
            logger.warn("Failed to enrich alert with AI. Falling back to rules only. Error: {}", ex.getMessage());
        }
    }

    private Integer resolveAge(PatientDTO patient, HealthTwinDTO twin) {
        if (patient.age() != null) return patient.age();
        if (patient.dob() != null && !patient.dob().isBlank()) {
            try {
                return Period.between(LocalDate.parse(patient.dob()), LocalDate.now()).getYears();
            } catch (Exception ignored) {}
        }
        return twin.age() != null ? twin.age() : 0;
    }

    private String resolveGender(PatientDTO patient, HealthTwinDTO twin) {
        if (patient.gender() != null && !patient.gender().isBlank()) return patient.gender();
        return twin.gender();
    }

    private String normalizeGender(String gender) {
        if (gender == null || gender.isBlank()) return "Unknown";
        String normalized = gender.trim().toLowerCase();
        return switch (normalized) {
            case "male", "m" -> "Male";
            case "female", "f" -> "Female";
            default -> "Unknown";
        };
    }

    private Object defaultNumeric(Number value) {
        return value == null ? 0 : value;
    }

    private String defaultYesNo(String value) {
        return (value == null || value.isBlank()) ? "No" : value;
    }

    public List<Alert> findAll() {
        return repository.findAll();
    }

    public List<Alert> findByPatientId(String patientId) {
        return repository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    public List<Alert> findActiveAlerts() {
        return repository.findByStatusNotOrderByCreatedAtDesc(AlertStatus.CLOSED);
    }

    public Alert findByAlertId(String alertId) {
        return repository.findByAlertId(alertId).orElse(null);
    }

    public Alert markSent(String alertId) {
        Alert alert = repository.findByAlertId(alertId)
                .orElseThrow(() -> new AlertNotFoundException("Alert not found with id: " + alertId));
        if (alert.getStatus() == AlertStatus.SENT || alert.getStatus() == AlertStatus.DELIVERED
                || alert.getStatus() == AlertStatus.ACKNOWLEDGED || alert.getStatus() == AlertStatus.CLOSED) {
            return alert;
        }
        alert.setStatus(AlertStatus.SENT);
        alert.setSentAt(LocalDateTime.now());
        logger.info("Alert {} status updated to SENT", alertId);
        return repository.save(alert);
    }

    public Alert markDelivered(String alertId) {
        Alert alert = repository.findByAlertId(alertId)
                .orElseThrow(() -> new AlertNotFoundException("Alert not found with id: " + alertId));
        if (alert.getStatus() == AlertStatus.DELIVERED || alert.getStatus() == AlertStatus.ACKNOWLEDGED
                || alert.getStatus() == AlertStatus.CLOSED) {
            return alert;
        }
        alert.setStatus(AlertStatus.DELIVERED);
        alert.setDeliveredAt(LocalDateTime.now());
        logger.info("Alert {} status updated to DELIVERED", alertId);
        return repository.save(alert);
    }

    public Alert acknowledgeAlert(String alertId, String acknowledgedBy) {
        if (acknowledgedBy == null || acknowledgedBy.isBlank()) {
            throw new InvalidAcknowledgementException("acknowledgedBy must not be null, blank, or missing");
        }
        Alert alert = repository.findByAlertId(alertId)
                .orElseThrow(() -> new AlertNotFoundException("Alert not found with id: " + alertId));
        if (alert.getStatus() == AlertStatus.CLOSED) {
            throw new InvalidLifecycleTransitionException("Cannot acknowledge a CLOSED alert");
        }
        if (alert.getStatus() == AlertStatus.ACKNOWLEDGED) {
            return alert;
        }
        alert.setStatus(AlertStatus.ACKNOWLEDGED);
        alert.setAcknowledgedAt(LocalDateTime.now());
        alert.setAcknowledgedBy(acknowledgedBy);
        logger.info("Alert {} acknowledged by {}", alertId, acknowledgedBy);
        return repository.save(alert);
    }

    public Alert closeAlert(String alertId) {
        Alert alert = repository.findByAlertId(alertId)
                .orElseThrow(() -> new AlertNotFoundException("Alert not found with id: " + alertId));
        if (alert.getStatus() == AlertStatus.CLOSED) {
            return alert;
        }
        if (alert.getStatus() != AlertStatus.ACKNOWLEDGED) {
            throw new InvalidLifecycleTransitionException("Alert must be ACKNOWLEDGED before it can be CLOSED.");
        }
        alert.setStatus(AlertStatus.CLOSED);
        alert.setClosedAt(LocalDateTime.now());
        logger.info("Alert {} closed", alertId);
        return repository.save(alert);
    }

    private boolean hasActiveAlert(String patientId, String type) {
        List<Alert> existing = repository.findByPatientIdAndTypeAndStatusNot(patientId, type, AlertStatus.CLOSED);
        return !existing.isEmpty();
    }
}
