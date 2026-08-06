package com.medisphere.predictionservice.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medisphere.predictionservice.client.FlaskClient;
import com.medisphere.predictionservice.client.HealthTwinClient;
import com.medisphere.predictionservice.client.PatientClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.medisphere.predictionservice.dto.FlaskRequest;
import com.medisphere.predictionservice.dto.HealthTwinDTO;
import com.medisphere.predictionservice.dto.PatientDTO;
import com.medisphere.predictionservice.exception.PredictionException;
import com.medisphere.predictionservice.mapper.PredictionMapper;
import com.medisphere.predictionservice.model.RiskPrediction;
import com.medisphere.predictionservice.repository.PredictionRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDate;
import java.time.Period;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class PredictionService {

    private static final Logger logger = LoggerFactory.getLogger(PredictionService.class);

    private final PatientClient patientClient;
    private final HealthTwinClient healthTwinClient;
    private final FlaskClient flaskClient;
    private final PredictionRepository repository;
    private final List<String> featureColumns;
    private final ObjectMapper mapper = new ObjectMapper();

    public PredictionService(
            PatientClient patientClient,
            HealthTwinClient healthTwinClient,
            FlaskClient flaskClient,
            PredictionRepository repository) {

        this.patientClient = patientClient;
        this.healthTwinClient = healthTwinClient;
        this.flaskClient = flaskClient;
        this.repository = repository;

        try {
            this.featureColumns = mapper.readValue(
                    new ClassPathResource("feature_columns.json").getInputStream(),
                    new TypeReference<List<String>>() {});
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load feature_columns.json", e);
        }
        logger.info("Loaded feature columns from feature_columns.json: {}", featureColumns);
    }

    public RiskPrediction predictAndSave(String patientId) {

        if (patientId == null || patientId.isBlank()) {
            throw new IllegalArgumentException("patientId is required");
        }

        PatientDTO patient = patientClient.getPatient(patientId);

        if (patient == null) {
            throw new PredictionException("Patient " + patientId + " not found");
        }

        String patientIdToUse = patient.patientId() != null ? patient.patientId() : patientId;
        if (!patientId.equals(patientIdToUse)) {
            logger.info("Resolved canonical patientId from patient service: requested='{}', resolved='{}'",
                    patientId, patientIdToUse);
        }

        HealthTwinDTO twin = healthTwinClient.getHealthTwin(patientIdToUse);

        if (twin == null) {
            throw new PredictionException("Health Twin for " + patientId + " not found");
        }

        Map<String, Object> features = buildFeatureMap(patient, twin);

        logger.info("Constructed feature map for Flask request: {}", features);
        logger.info("Feature columns order used: {}", featureColumns);

        FlaskRequest request = new FlaskRequest(features);

        Map<String, Object> flaskResponse;

        try {
            flaskResponse = flaskClient.predict(request);
        } catch (Exception ex) {
            throw new PredictionException("Failed to call Flask AI service", ex);
        }

        RiskPrediction entity = PredictionMapper.toEntity(patientId, flaskResponse);

        return repository.save(entity);
    }

    private Map<String, Object> buildFeatureMap(
            PatientDTO patient,
            HealthTwinDTO twin) {

        Map<String, Object> map = new LinkedHashMap<>();

        for (String column : featureColumns) {

            switch (column) {

                case "age":
                    map.put(column, resolveAge(patient, twin));
                    break;

                case "gender":
                    map.put(column, normalizeGender(resolveGender(patient, twin)));
                    break;

                case "height":
                    map.put(column, defaultNumeric(twin.height()));
                    break;

                case "weight":
                    map.put(column, defaultNumeric(twin.weight()));
                    break;

                case "bmi":
                    map.put(column, defaultNumeric(twin.bmi()));
                    break;

                case "heartRate":
                    map.put(column, defaultNumeric(twin.heartRate()));
                    break;

                case "systolicBP":
                    map.put(column, defaultNumeric(twin.systolicBP()));
                    break;

                case "diastolicBP":
                    map.put(column, defaultNumeric(twin.diastolicBP()));
                    break;

                case "oxygen":
                    map.put(column, defaultNumeric(twin.oxygen()));
                    break;

                case "temperature":
                    map.put(column, defaultNumeric(twin.temperature()));
                    break;

                case "steps":
                    map.put(column, defaultNumeric(twin.steps()));
                    break;

                case "sleepHours":
                    map.put(column, defaultNumeric(twin.sleepHours()));
                    break;

                case "cholesterol":
                    map.put(column, defaultNumeric(twin.cholesterol()));
                    break;

                case "bloodGlucose":
                    map.put(column, defaultNumeric(twin.bloodGlucose()));
                    break;

                case "hbA1c":
                    map.put(column, defaultNumeric(twin.hbA1c()));
                    break;

                case "smokingHistory":
                    map.put(column, defaultYesNo(twin.smokingHistory()));
                    break;

                case "familyHistory":
                    map.put(column, defaultYesNo(twin.familyHistory()));
                    break;

                default:
                    throw new IllegalStateException(
                            "Unexpected feature column: " + column);
            }
        }

        return map;
    }

    private Integer resolveAge(PatientDTO patient, HealthTwinDTO twin) {
        if (patient.age() != null) {
            return patient.age();
        }

        if (patient.dob() != null && !patient.dob().isBlank()) {
            return calculateAgeFromDob(patient.dob());
        }

        return twin.age();
    }

    private String resolveGender(PatientDTO patient, HealthTwinDTO twin) {
        if (patient.gender() != null && !patient.gender().isBlank()) {
            return patient.gender();
        }

        return twin.gender();
    }

    private String normalizeGender(String gender) {
        if (gender == null || gender.isBlank()) {
            return null;
        }

        String normalized = gender.trim().toLowerCase();
        return switch (normalized) {
            case "male", "m" -> "Male";
            case "female", "f" -> "Female";
            default -> gender.trim();
        };
    }

    private Object defaultNumeric(Number value) {
        return value == null ? 0 : value;
    }

    private String defaultYesNo(String value) {
        if (value == null || value.isBlank()) {
            return "No";
        }
        return value;
    }

    private Integer calculateAgeFromDob(String dob) {
        try {
            LocalDate birthDate = LocalDate.parse(dob);
            return Period.between(birthDate, LocalDate.now()).getYears();
        } catch (Exception e) {
            return null;
        }
    }
}