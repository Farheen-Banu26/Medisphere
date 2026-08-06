package com.infosys.Medisphere.App.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.infosys.Medisphere.App.model.Patient;
import com.infosys.Medisphere.App.repository.PatientRepository;

@Service
public class PatientService {

    @Autowired
    private PatientRepository repository;

    private final RestTemplate restTemplate = new RestTemplate();

    // ===========================================
    // Register Patient
    // ===========================================
    public String registerPatient(Patient patient) {

        // Check if Patient ID already exists
        if (repository.findByPatientIdIgnoreCase(patient.getPatientId().trim()).isPresent()) {
            return "Patient ID already exists";
        }

        patient.setCreatedAt(LocalDateTime.now());

        repository.save(patient);

        try {
            Map<String, Object> twinPayload = new HashMap<>();
            twinPayload.put("patientId", patient.getPatientId());
            twinPayload.put("height", 0.0);
            twinPayload.put("weight", 0.0);
            twinPayload.put("bloodGroup", "");
            twinPayload.put("allergies", List.of());
            twinPayload.put("chronicDiseases", List.of());
            twinPayload.put("currentMedications", List.of());
            twinPayload.put("riskScore", 0.0);
            twinPayload.put("healthScore", 100.0);
            twinPayload.put("bmi", 0.0);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> twinRequest = new HttpEntity<>(twinPayload, headers);
            restTemplate.postForEntity("http://localhost:8990/api/twins", twinRequest, String.class);
        } catch (RuntimeException ex) {
            System.out.println("Health twin creation failed: " + ex.getMessage());
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("action", "REGISTER_PATIENT");
            payload.put("user", "system");
            payload.put("role", "SYSTEM");
            payload.put("patientId", patient.getPatientId());
            payload.put("status", "SUCCESS");
            payload.put("details", "Patient registered successfully");
            restTemplate.postForEntity("http://localhost:8994/api/audit/logs", payload, String.class);
        } catch (RuntimeException ex) {
            System.out.println("Audit log write failed: " + ex.getMessage());
        }

        System.out.println("================================");
        System.out.println("Patient Saved Successfully");
        System.out.println(patient);
        System.out.println("================================");

        return "Patient Registered Successfully";
    }

    // ===========================================
    // Get All Patients
    // ===========================================
    public List<Patient> getAllPatients() {

        List<Patient> patients = repository.findAll();

        System.out.println("================================");
        System.out.println("Database : test");
        System.out.println("Patients Found = " + patients.size());
        System.out.println(patients);
        System.out.println("================================");

        return patients;
    }

    // ===========================================
    // Get Patient By Patient ID
    // ===========================================
    public Patient getPatientById(String patientId) {

        Patient patient = repository.findByPatientIdIgnoreCase(patientId.trim()).orElse(null);

        System.out.println("================================");
        System.out.println("Searching Patient : " + patientId);
        System.out.println("Result : " + patient);
        System.out.println("================================");

        return patient;
    }

    // ===========================================
    // Update Patient
    // ===========================================
    public String updatePatient(String patientId, Patient patient) {

        Patient existingPatient = repository.findByPatientIdIgnoreCase(patientId.trim()).orElse(null);

        if (existingPatient == null) {
            return "Patient Not Found";
        }

        patient.setId(existingPatient.getId());
        patient.setPatientId(patientId);
        patient.setCreatedAt(existingPatient.getCreatedAt());

        repository.save(patient);

        System.out.println("================================");
        System.out.println("Patient Updated Successfully");
        System.out.println(patient);
        System.out.println("================================");

        return "Patient Updated Successfully";
    }

    // ===========================================
    // Delete Patient
    // ===========================================
    public String deletePatient(String id) {

        repository.deleteById(id);

        System.out.println("================================");
        System.out.println("Patient Deleted : " + id);
        System.out.println("================================");

        return "Patient Deleted Successfully";
    }
}