package com.infosys.health_twin_service.client;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class VitalsClient {

    @Autowired
    private RestTemplate restTemplate;

    public Object getLatestVitals(String patientId) {
        if (patientId == null || patientId.isBlank()) return null;
        try {
            return restTemplate.getForObject(
                    "http://vitals-service/api/vitals/latest/{patientId}",
                    Object.class,
                    patientId);
        } catch (Exception e) {
            System.err.println("VitalsClient error for " + patientId + ": " + e.getMessage());
            return null;
        }
    }
}