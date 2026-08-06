package com.medisphere.careplan_service.client;

import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class FlaskClient {

    private static final Logger logger = LoggerFactory.getLogger(FlaskClient.class);
    private final WebClient client;
    private final Duration timeout;

    public FlaskClient(
            @Value("${flask.service.base-url:http://localhost:5000}") String baseUrl,
            @Value("${service.call.timeout:5000}") long timeoutMs) {

        this.client = WebClient.builder()
                .baseUrl(baseUrl)
                .build();

        this.timeout = Duration.ofMillis(timeoutMs);
    }

    public FlaskResponse predict(FlaskRequest request) {
        try {
            logger.info("Calling Flask AI Service at /api/predict");
            return client.post()
                    .uri("/api/predict")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(FlaskResponse.class)
                    .block(timeout);
        } catch (Exception ex) {
            logger.error("Failed to call Flask AI service: {}", ex.getMessage());
            throw new RuntimeException("Flask AI Service unavailable: " + ex.getMessage(), ex);
        }
    }
}
