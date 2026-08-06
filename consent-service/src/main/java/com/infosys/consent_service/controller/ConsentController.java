package com.infosys.consent_service.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.infosys.consent_service.model.Consent;
import com.infosys.consent_service.service.ConsentService;

@RestController
@RequestMapping("/api/consents")
public class ConsentController {

    @Autowired
    private ConsentService service;

    // Create Consent
    @PostMapping
    public String createConsent(@RequestBody Consent consent) {

        return service.createConsent(consent);
    }

    // Get Consent
    @GetMapping("/{patientId}")
    public Consent getConsent(@PathVariable String patientId) {

        return service.getConsent(patientId);
    }

    // Update Consent
    @PutMapping("/{id}")
    public String updateConsent(@PathVariable String id,
                                @RequestBody Consent consent) {

        return service.updateConsent(id, consent);
    }

    // Delete Consent
    @DeleteMapping("/{id}")
    public String deleteConsent(@PathVariable String id) {

        return service.deleteConsent(id);
    }

    // Verify Consent
    @PostMapping("/verify/{patientId}")
    public String verifyConsent(@PathVariable String patientId) {

        return service.verifyConsent(patientId);
    }

    // Revoke Consent
    @PostMapping("/revoke/{patientId}")
    public String revokeConsent(@PathVariable String patientId) {

        return service.revokeConsent(patientId);
    }

}