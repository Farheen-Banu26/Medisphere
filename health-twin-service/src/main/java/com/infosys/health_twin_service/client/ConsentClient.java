package com.infosys.health_twin_service.client;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class ConsentClient {

    @Autowired
    private RestTemplate restTemplate;

    public Object getConsent(String patientId) {

        return restTemplate.getForObject(
                "http://consent-service/api/consents/{patientId}",
                Object.class,
                patientId);

    }
}