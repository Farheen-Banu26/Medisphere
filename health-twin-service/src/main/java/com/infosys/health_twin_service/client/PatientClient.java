package com.infosys.health_twin_service.client;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class PatientClient {

    @Autowired
    private RestTemplate restTemplate;

    public Object getPatient(String patientId) {

        Object patient = restTemplate.getForObject(
                "http://patient-service/api/patients/{patientId}",
                Object.class,
                patientId);

        System.out.println("Patient from Patient Service = " + patient);

        return patient;
    }
}