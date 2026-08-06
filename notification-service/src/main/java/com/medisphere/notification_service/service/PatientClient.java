package com.medisphere.notification_service.service;

import com.medisphere.notification_service.dto.PatientDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Service
public class PatientClient {

    private static final Logger logger = LoggerFactory.getLogger(PatientClient.class);
    private final WebClient client;
    private final Duration timeout;

    public PatientClient(@Value("${medisphere.patient-service.base-url:http://localhost:8081}") String baseUrl,
                         @Value("${service.call.timeout:5000}") long timeoutMs) {
        this.client = WebClient.builder().baseUrl(baseUrl).build();
        this.timeout = Duration.ofMillis(timeoutMs);
    }

    public PatientDTO getPatient(String patientId) {
        if (patientId == null || patientId.isBlank()) {
            return null;
        }
        try {
            return client.get()
                    .uri(uriBuilder -> uriBuilder.path("/api/patients/{id}").build(patientId))
                    .retrieve()
                    .bodyToMono(PatientDTO.class)
                    .block(timeout);
        } catch (Exception ex) {
            logger.warn("Failed to fetch patient data for email retrieval: {}", ex.getMessage());
            return null;
        }
    }
}
