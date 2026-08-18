package com.infosys.health_twin_service.client;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class FhirClient {

    @Autowired
    private RestTemplate restTemplate;

    public List<Object> getFhirResources(String patientId) {
        if (patientId == null || patientId.isBlank()) return new ArrayList<>();
        try {
            List<Object> res = restTemplate.getForObject(
                    "http://fhir-service/api/fhir/{patientId}",
                    List.class,
                    patientId);
            return res != null ? res : new ArrayList<>();
        } catch (Exception e) {
            System.err.println("FhirClient error for " + patientId + ": " + e.getMessage());
            return new ArrayList<>();
        }
    }
}
