package com.medisphere.careplan_service.client;

import java.time.Duration;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Component
public class VitalsClient {

    private static final Logger logger = LoggerFactory.getLogger(VitalsClient.class);
    private final WebClient client;
    private final Duration timeout;

    public VitalsClient(@Value("${vitals.service.base-url:http://localhost:8992}") String baseUrl,
                        @Value("${service.call.timeout:5000}") long timeoutMs) {
        this.client = WebClient.builder().baseUrl(baseUrl).build();
        this.timeout = Duration.ofMillis(timeoutMs);
    }

    /**
     * Retrieves the latest vitals reading for a patient from vitals-service.
     */
    public VitalsDTO getLatestVitals(String patientId) {
        if (patientId == null || patientId.isBlank()) {
            return null;
        }

        try {
            return client.get()
                    .uri(uriBuilder -> uriBuilder.path("/api/vitals/latest/{id}").build(patientId))
                    .retrieve()
                    .bodyToMono(VitalsDTO.class)
                    .block(timeout);
        } catch (WebClientResponseException.NotFound ex) {
            logger.info("No vitals record found for patient {}", patientId);
            return null;
        } catch (Exception ex) {
            logger.warn("Error fetching latest vitals for patient {}: {}", patientId, ex.getMessage());
            return null;
        }
    }

    /**
     * Retrieves historical vitals readings for a patient from vitals-service.
     */
    public List<VitalsDTO> getVitalsHistory(String patientId) {
        if (patientId == null || patientId.isBlank()) {
            return List.of();
        }

        try {
            return client.get()
                    .uri(uriBuilder -> uriBuilder.path("/api/vitals/{id}").build(patientId))
                    .retrieve()
                    .bodyToMono(new org.springframework.core.ParameterizedTypeReference<List<VitalsDTO>>() {})
                    .block(timeout);
        } catch (Exception ex) {
            logger.warn("Error fetching vitals history for patient {}: {}", patientId, ex.getMessage());
            return List.of();
        }
    }
}
