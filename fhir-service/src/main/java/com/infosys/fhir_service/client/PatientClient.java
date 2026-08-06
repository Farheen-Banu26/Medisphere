package com.infosys.fhir_service.client;

import java.time.Duration;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.infosys.fhir_service.exception.FhirServiceException;

import reactor.core.publisher.Mono;

@Component
public class PatientClient {

    private final WebClient webClient;

    public PatientClient(@Value("${patient.service.url:http://localhost:8989}") String baseUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Accept", "application/json")
                .build();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getPatient(String patientId) {
        if (patientId == null || patientId.isBlank()) {
            throw new FhirServiceException("400", "Invalid patient ID");
        }

        try {
            Map<String, Object> patient = webClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/api/patients/{id}").build(patientId))
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, response -> Mono.error(new FhirServiceException("404", "Local patient not found")))
                    .onStatus(HttpStatusCode::is5xxServerError, response -> Mono.error(new FhirServiceException("500", "Patient service unavailable")))
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            if (patient == null || patient.get("patientId") == null) {
                throw new FhirServiceException("404", "Local patient not found");
            }
            return patient;
        } catch (WebClientResponseException e) {
            if (e.getStatusCode().value() == 404) {
                throw new FhirServiceException("404", "Local patient not found");
            }
            throw new FhirServiceException(String.valueOf(e.getStatusCode().value()), e.getMessage());
        } catch (FhirServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new FhirServiceException("500", "Unable to read local patient data");
        }
    }
}
