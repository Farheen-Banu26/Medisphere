package com.medisphere.careplan_service.client;

import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Component
public class PatientClient {

    private static final Logger logger = LoggerFactory.getLogger(PatientClient.class);
    private final WebClient client;
    private final Duration timeout;

    public PatientClient(@Value("${patient.service.base-url:http://localhost:8989}") String baseUrl,
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
        } catch (WebClientResponseException.NotFound ex) {
            logger.warn("Patient {} not found", patientId);
            return null;
        } catch (Exception ex) {
            logger.warn("Error fetching patient {}: {}", patientId, ex.getMessage());
            return null;
        }
    }
}
