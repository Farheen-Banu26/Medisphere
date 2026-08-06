package com.medisphere.predictionservice.client;

import java.time.Duration;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import com.medisphere.predictionservice.dto.FlaskRequest;
import com.medisphere.predictionservice.dto.FlaskResponse;

@Component
public class FlaskClient {

    private final WebClient client;
    private final Duration timeout;

    public FlaskClient(
            @Value("${flask.service.base-url}") String baseUrl,
            @Value("${service.call.timeout}") long timeoutMs) {

        this.client = WebClient.builder()
                .baseUrl(baseUrl)
                .build();

        this.timeout = Duration.ofMillis(timeoutMs);
    }

    public Map<String, Object> predict(FlaskRequest request) {

        try {

            System.out.println("========================================");
            System.out.println("Calling Flask AI Service...");
            System.out.println("URL : http://localhost:5000/api/predict");
            System.out.println("Outgoing Flask JSON: " + request);
            System.out.println("========================================");

            FlaskResponse response = client.post()
                    .uri("/api/predict")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(FlaskResponse.class)
                    .block(timeout);

            System.out.println("Flask Response : " + response);

            return Map.of(
                    "status", response.status(),
                    "predictionTime", response.predictionTime(),
                    "heartDisease", response.heartDisease(),
                    "diabetes", response.diabetes()
            );

        } catch (Exception ex) {

            System.out.println("========== FLASK CLIENT ERROR ==========");
            ex.printStackTrace();
            System.out.println("========================================");

            throw new RuntimeException("Failed to call Flask AI service", ex);
        }
    }
}