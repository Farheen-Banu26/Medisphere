package com.medisphere.alert_service.client;

import java.time.Duration;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import com.medisphere.alert_service.dto.FlaskRequest;
import com.medisphere.alert_service.dto.FlaskResponse;

@Component
public class FlaskClient {

    private static final Logger logger = LoggerFactory.getLogger(FlaskClient.class);
    private final WebClient client;
    private final Duration timeout;

    public FlaskClient(
            @Value("${flask.service.base-url:http://localhost:5000}") String baseUrl,
            @Value("${flask.call.timeout:5000}") long timeoutMs) {

        this.client = WebClient.builder()
                .baseUrl(baseUrl)
                .build();

        this.timeout = Duration.ofMillis(timeoutMs);
    }

    public Map<String, Object> predict(FlaskRequest request) {

        try {
            logger.info("Calling Flask AI Service at /api/predict");
            logger.debug("Outgoing Flask JSON: {}", request);

            FlaskResponse response = client.post()
                    .uri("/api/predict")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(FlaskResponse.class)
                    .block(timeout);

            logger.info("Flask Response received");

            return Map.of(
                    "status", response.status() != null ? response.status() : "UNKNOWN",
                    "predictionTime", response.predictionTime() != null ? response.predictionTime() : "",
                    "heartDisease", response.heartDisease() != null ? response.heartDisease() : Map.of(),
                    "diabetes", response.diabetes() != null ? response.diabetes() : Map.of()
            );

        } catch (Exception ex) {
            logger.warn("Failed to call Flask AI service: {}", ex.getMessage());
            throw new RuntimeException("Failed to call Flask AI service", ex);
        }
    }
}
