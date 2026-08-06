package com.infosys.health_twin_service.client;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class VitalsClient {

    @Autowired
    private RestTemplate restTemplate;

    public Object getLatestVitals(String patientId) {

        return restTemplate.getForObject(
                "http://vitals-service/api/vitals/latest/{patientId}",
                Object.class,
                patientId);

    }
}