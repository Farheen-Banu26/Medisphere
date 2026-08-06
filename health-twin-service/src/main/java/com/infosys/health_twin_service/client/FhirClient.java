package com.infosys.health_twin_service.client;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class FhirClient {

    @Autowired
    private RestTemplate restTemplate;

    public List<Object> getFhirResources(String patientId) {
        return restTemplate.getForObject(
                "http://fhir-service/api/fhir/{patientId}",
                List.class,
                patientId);
    }
}
