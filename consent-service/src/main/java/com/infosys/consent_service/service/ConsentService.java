package com.infosys.consent_service.service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.infosys.consent_service.model.Consent;
import com.infosys.consent_service.repository.ConsentRepository;

@Service
public class ConsentService {

    @Autowired
    private ConsentRepository repository;

    private final RestTemplate restTemplate = new RestTemplate();

    // ===========================================
    // Create Consent
    // ===========================================
    public String createConsent(Consent consent) {

        // Prevent duplicate Consent
        if (repository.findByPatientIdIgnoreCase(consent.getPatientId().trim()).isPresent()) {
            return "Consent already exists";
        }

        repository.save(consent);

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("action", "GRANT_CONSENT");
            payload.put("user", "system");
            payload.put("role", "SYSTEM");
            payload.put("patientId", consent.getPatientId());
            payload.put("status", "SUCCESS");
            payload.put("details", "Consent granted successfully");
            restTemplate.postForEntity("http://localhost:8994/api/audit/logs", payload, String.class);
        } catch (RuntimeException ex) {
            System.out.println("Audit log write failed: " + ex.getMessage());
        }

        return "Consent Created Successfully";
    }

    // ===========================================
    // Get Consent
    // ===========================================
    public Consent getConsent(String patientId) {

        Optional<Consent> consent = repository.findByPatientIdIgnoreCase(patientId.trim());

        return consent.orElse(null);
    }

    // ===========================================
    // Update Consent
    // ===========================================
    public String updateConsent(String id, Consent updatedConsent) {

        Optional<Consent> optional = repository.findById(id);

        if (optional.isPresent()) {

            Consent consent = optional.get();

            consent.setPatientId(updatedConsent.getPatientId());
            consent.setProviderId(updatedConsent.getProviderId());
            consent.setPurpose(updatedConsent.getPurpose());
            consent.setStatus(updatedConsent.getStatus());
            consent.setGrantedOn(updatedConsent.getGrantedOn());
            consent.setExpiryDate(updatedConsent.getExpiryDate());
            consent.setRevoked(updatedConsent.getRevoked() != null ? updatedConsent.getRevoked() : Boolean.FALSE);

            repository.save(consent);

            try {
                Map<String, Object> payload = new HashMap<>();
                payload.put("action", "UPDATE_CONSENT");
                payload.put("user", "system");
                payload.put("role", "SYSTEM");
                payload.put("patientId", consent.getPatientId());
                payload.put("status", "SUCCESS");
                payload.put("details", "Consent updated successfully");
                restTemplate.postForEntity("http://localhost:8994/api/audit/logs", payload, String.class);
            } catch (RuntimeException ex) {
                System.out.println("Audit log write failed: " + ex.getMessage());
            }

            return "Consent Updated Successfully";
        }

        return "Consent Not Found";
    }

    // ===========================================
    // Delete Consent
    // ===========================================
    public String deleteConsent(String id) {

        repository.deleteById(id);

        return "Consent Deleted Successfully";
    }

    // ===========================================
    // Verify Consent
    // ===========================================
    public String verifyConsent(String patientId) {

        Optional<Consent> optional = repository.findByPatientIdIgnoreCase(patientId.trim());

        if (optional.isPresent()) {

            Consent consent = optional.get();

            if (Boolean.FALSE.equals(consent.getRevoked())
                    && "GRANTED".equalsIgnoreCase(consent.getStatus())) {

                return "Consent Verified";
            }
        }

        return "Consent Invalid";
    }

    // ===========================================
    // Revoke Consent
    // ===========================================
    public String revokeConsent(String patientId) {

        Optional<Consent> optional = repository.findByPatientIdIgnoreCase(patientId.trim());

        if (optional.isPresent()) {

            Consent consent = optional.get();

            consent.setRevoked(true);
            consent.setStatus("REVOKED");

            repository.save(consent);

            try {
                Map<String, Object> payload = new HashMap<>();
                payload.put("action", "REVOKE_CONSENT");
                payload.put("user", "system");
                payload.put("role", "SYSTEM");
                payload.put("patientId", consent.getPatientId());
                payload.put("status", "SUCCESS");
                payload.put("details", "Consent revoked successfully");
                restTemplate.postForEntity("http://localhost:8994/api/audit/logs", payload, String.class);
            } catch (RuntimeException ex) {
                System.out.println("Audit log write failed: " + ex.getMessage());
            }

            return "Consent Revoked Successfully";
        }

        return "Consent Not Found";
    }

}