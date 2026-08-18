package com.infosys.wearable_simulator.service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
public class PatientService {

    private static final Logger logger = LoggerFactory.getLogger(PatientService.class);

    private final RestTemplate restTemplate;
    private final String patientServiceUrl;

    public PatientService(@Value("${patient.service.url:http://localhost:8989/api/patients}") String patientServiceUrl) {
        this.restTemplate = new RestTemplate();
        this.patientServiceUrl = patientServiceUrl;
    }

    public List<String> fetchPatientIds() {
        try {
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    patientServiceUrl,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {
                    }
            );

            List<Map<String, Object>> patients = response.getBody();
            if (patients == null || patients.isEmpty()) {
                logger.warn("Patient service returned empty patient list from {}", patientServiceUrl);
                return Collections.emptyList();
            }

            List<String> fetched = patients.stream()
                    .map(this::extractPatientId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            if (!fetched.isEmpty()) {
                return fetched;
            }
        } catch (RestClientException ex) {
            logger.warn("Failed to fetch patients from {}: {}. Falling back to default simulator patients.", patientServiceUrl, ex.getMessage());
        }
        return List.of("P1001", "P1002", "P101", "PT00001", "PT00002");
    }

    private String extractPatientId(Map<String, Object> patient) {
        if (patient == null) {
            return null;
        }

        Object patientId = patient.get("patientId");
        if (patientId == null) {
            patientId = patient.get("patient_id");
        }
        if (patientId == null) {
            patientId = patient.get("id");
        }

        if (patientId == null) {
            logger.warn("Skipping patient record without patientId: {}", patient);
            return null;
        }

        return patientId.toString();
    }
}
