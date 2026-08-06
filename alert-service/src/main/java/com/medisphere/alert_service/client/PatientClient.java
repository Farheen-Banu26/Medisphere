package com.medisphere.alert_service.client;

import com.medisphere.alert_service.dto.PatientDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;

@Component
public class PatientClient {

    private final WebClient client;
    private final Duration timeout;

    public PatientClient(@Value("${patient.service.base-url:http://localhost:8081}") String baseUrl,
                         @Value("${service.call.timeout:5000}") long timeoutMs) {
        this.client = WebClient.builder().baseUrl(baseUrl).build();
        this.timeout = Duration.ofMillis(timeoutMs);
    }

    public PatientDTO getPatient(String patientId) {
        try {
            return client.get()
                    .uri(uriBuilder -> uriBuilder.path("/api/patients/{id}").build(patientId))
                    .retrieve()
                    .bodyToMono(PatientDTO.class)
                    .block(timeout);
        } catch (WebClientResponseException.NotFound ex) {
            return null;
        } catch (Exception ex) {
            System.err.println("Failed to fetch patient data: " + ex.getMessage());
            return null;
        }
    }
}
