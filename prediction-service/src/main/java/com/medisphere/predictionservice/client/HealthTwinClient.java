package com.medisphere.predictionservice.client;

import com.medisphere.predictionservice.dto.HealthTwinDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;

@Component
public class HealthTwinClient {

    private static final Logger logger = LoggerFactory.getLogger(HealthTwinClient.class);
    private final WebClient client;
    private final Duration timeout;

    public HealthTwinClient(@Value("${healthtwin.service.base-url}") String baseUrl,
                            @Value("${service.call.timeout}") long timeoutMs) {
        this.client = WebClient.builder().baseUrl(baseUrl).build();
        this.timeout = Duration.ofMillis(timeoutMs);
    }

    public HealthTwinDTO getHealthTwin(String patientId) {
        if (patientId == null || patientId.isBlank()) {
            return null;
        }

        HealthTwinDTO twin = fetchHealthTwin(patientId);
        if (twin == null && !patientId.equals(patientId.toLowerCase())) {
            logger.info("Health twin not found for '{}', retrying with lowercase id '{}'", patientId, patientId.toLowerCase());
            twin = fetchHealthTwin(patientId.toLowerCase());
        }

        return twin;
    }

    private HealthTwinDTO fetchHealthTwin(String patientId) {
        try {
            return client.get()
                    .uri(uriBuilder -> uriBuilder.path("/api/twins/{id}").build(patientId))
                    .retrieve()
                    .bodyToMono(HealthTwinDTO.class)
                    .block(timeout);
        } catch (WebClientResponseException.NotFound ex) {
            return null;
        }
    }
}
