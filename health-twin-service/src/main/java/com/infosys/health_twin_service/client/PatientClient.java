package com.infosys.health_twin_service.client;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class PatientClient {

    @Autowired
    private RestTemplate restTemplate;

    public Object getPatient(String patientId) {
        if (patientId == null || patientId.isBlank()) return null;
        try {
            Object patient = restTemplate.getForObject(
                    "http://patient-service/api/patients/{patientId}",
                    Object.class,
                    patientId);
            if (patient != null) {
                System.out.println("Patient from Patient Service = " + patient);
                return patient;
            }
        } catch (Exception e) {
            System.err.println("PatientClient error for " + patientId + ": " + e.getMessage());
            try {
                String altId = patientId.contains("-") ? patientId.replace("-", "") : 
                               (patientId.matches("(?i)^P\\d+$") ? "P-" + patientId.substring(1) : patientId);
                if (!altId.equals(patientId)) {
                    Object altPatient = restTemplate.getForObject(
                            "http://patient-service/api/patients/{patientId}",
                            Object.class,
                            altId);
                    if (altPatient != null) {
                        System.out.println("Patient from Patient Service (alt ID " + altId + ") = " + altPatient);
                        return altPatient;
                    }
                }
            } catch (Exception ignored) {}
        }
        return null;
    }
}