package com.infosys.health_twin_service.dto;

public class Patient360Response {

    private Object patient;
    private Object healthTwin;
    private Object latestVitals;
    private Object consent;
    private Object fhirResources;

    public Patient360Response() {
    }

    public Patient360Response(Object patient, Object healthTwin,
                              Object latestVitals, Object consent,
                              Object fhirResources) {
        this.patient = patient;
        this.healthTwin = healthTwin;
        this.latestVitals = latestVitals;
        this.consent = consent;
        this.fhirResources = fhirResources;
    }

    public Object getPatient() {
        return patient;
    }

    public void setPatient(Object patient) {
        this.patient = patient;
    }

    public Object getHealthTwin() {
        return healthTwin;
    }

    public void setHealthTwin(Object healthTwin) {
        this.healthTwin = healthTwin;
    }

    public Object getLatestVitals() {
        return latestVitals;
    }

    public void setLatestVitals(Object latestVitals) {
        this.latestVitals = latestVitals;
    }

    public Object getConsent() {
        return consent;
    }

    public void setConsent(Object consent) {
        this.consent = consent;
    }

    public Object getFhirResources() {
        return fhirResources;
    }

    public void setFhirResources(Object fhirResources) {
        this.fhirResources = fhirResources;
    }
}