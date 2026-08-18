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

    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void autoSeedOnStartup() {
        try {
            String result = seedPatients();
            System.out.println("==========================================");
            System.out.println("Patient Service Auto-Seed: " + result);
            System.out.println("==========================================");
        } catch (Exception ex) {
            System.err.println("Auto-seed error: " + ex.getMessage());
        }
    }

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

    // ===========================================
    // Identity Mapping: Keycloak -> Application Doctor ID
    // ===========================================
    public String resolveDoctorId(String doctorIdentifier) {
        if (doctorIdentifier == null || doctorIdentifier.trim().isEmpty()) {
            return "D001";
        }
        String normalized = doctorIdentifier.trim().toLowerCase();
        switch (normalized) {
            case "doctor":
            case "d001":
            case "dr_jenkins":
            case "sarah":
                return "D001";
            case "dr_smith":
            case "d002":
            case "robert":
                return "D002";
            case "dr_jones":
            case "d003":
            case "emily":
                return "D003";
            case "dr_patel":
            case "d004":
            case "rajesh":
                return "D004";
            case "dr_chen":
            case "d005":
            case "michael":
                return "D005";
            default:
                return doctorIdentifier.toUpperCase();
        }
    }

    // ===========================================
    // Security Context & Identity Resolution
    // ===========================================
    public static class SecurityUserContext {
        public String username;
        public String email;
        public List<String> roles = new java.util.ArrayList<>();
        public boolean isAdmin = false;
        public boolean isDoctor = false;
        public boolean isPatient = false;
    }

    public SecurityUserContext parseSecurityContext(jakarta.servlet.http.HttpServletRequest request) {
        SecurityUserContext ctx = new SecurityUserContext();
        if (request == null) return ctx;

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ctx;
        }

        String token = authHeader.substring(7).trim();
        String[] parts = token.split("\\.");
        if (parts.length < 2) return ctx;

        try {
            String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(parts[1]), java.nio.charset.StandardCharsets.UTF_8);
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(payloadJson);

            if (root.has("preferred_username")) {
                ctx.username = root.get("preferred_username").asText();
            }
            if (root.has("email")) {
                ctx.email = root.get("email").asText();
            }
            if (root.has("realm_access") && root.get("realm_access").has("roles")) {
                for (com.fasterxml.jackson.databind.JsonNode r : root.get("realm_access").get("roles")) {
                    String role = r.asText().toUpperCase();
                    ctx.roles.add(role);
                    if ("ADMIN".equals(role)) ctx.isAdmin = true;
                    if ("DOCTOR".equals(role)) ctx.isDoctor = true;
                    if ("PATIENT".equals(role)) ctx.isPatient = true;
                }
            }
        } catch (Exception ex) {
            System.err.println("JWT Parse Exception: " + ex.getMessage());
        }
        return ctx;
    }

    public String resolvePatientId(String username, String email) {
        if (username != null && !username.trim().isEmpty()) {
            String u = username.trim();
            java.util.Optional<Patient> byId = repository.findByPatientIdIgnoreCase(u);
            if (byId.isPresent()) {
                return byId.get().getPatientId();
            }
            if ("patient".equalsIgnoreCase(u) || "farheen".equalsIgnoreCase(u)) {
                return "P1001";
            }
            return u.toUpperCase();
        }
        if (email != null && !email.trim().isEmpty()) {
            if ("banufarheen786786@gmail.com".equalsIgnoreCase(email) || "patient@medisphere.com".equalsIgnoreCase(email)) {
                return "P1001";
            }
        }
        return "P1001";
    }

    // ===========================================
    // Assignment Queries (Secured)
    // ===========================================
    public List<Patient> getPatientsByDoctor(String doctorIdentifier) {
        String resolvedId = resolveDoctorId(doctorIdentifier);
        List<Patient> list = repository.findByAssignedDoctorIdIgnoreCase(resolvedId);
        if (list.isEmpty() && !resolvedId.equalsIgnoreCase(doctorIdentifier)) {
            list = repository.findByAssignedDoctorIdIgnoreCase(doctorIdentifier);
        }
        return list;
    }

    public List<Patient> getPatientsByDoctorSecured(String requestedDoctorId, jakarta.servlet.http.HttpServletRequest request) {
        SecurityUserContext ctx = parseSecurityContext(request);
        String targetDocId = resolveDoctorId(requestedDoctorId);

        if (ctx.username != null && !ctx.username.trim().isEmpty()) {
            if (ctx.isAdmin) {
                return getPatientsByDoctor(targetDocId);
            }
            String authenticatedDocId = resolveDoctorId(ctx.username);
            if (targetDocId.equalsIgnoreCase(authenticatedDocId) || requestedDoctorId.equalsIgnoreCase(ctx.username)) {
                return getPatientsByDoctor(targetDocId);
            }
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN,
                "Access Denied: Doctor " + authenticatedDocId + " cannot access Doctor " + targetDocId + " patients"
            );
        }

        return getPatientsByDoctor(targetDocId);
    }

    public Patient getPatientByIdSecured(String requestedPatientId, jakarta.servlet.http.HttpServletRequest request) {
        SecurityUserContext ctx = parseSecurityContext(request);

        if (ctx.username != null && !ctx.username.trim().isEmpty()) {
            if (ctx.isAdmin || ctx.isDoctor) {
                return getPatientById(requestedPatientId);
            }
            if (ctx.isPatient) {
                String mappedPatientId = resolvePatientId(ctx.username, ctx.email);
                if (requestedPatientId.equalsIgnoreCase(mappedPatientId)) {
                    return getPatientById(requestedPatientId);
                }
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Access Denied: Patient " + mappedPatientId + " cannot access Patient " + requestedPatientId + " record"
                );
            }
        }

        return getPatientById(requestedPatientId);
    }

    public List<Patient> getAllPatientsSecured(jakarta.servlet.http.HttpServletRequest request) {
        SecurityUserContext ctx = parseSecurityContext(request);

        if (ctx.username != null && !ctx.username.trim().isEmpty()) {
            if (ctx.isAdmin) {
                return getAllPatients();
            }
            if (ctx.isDoctor) {
                return getPatientsByDoctor(resolveDoctorId(ctx.username));
            }
            if (ctx.isPatient) {
                Patient p = getPatientById(resolvePatientId(ctx.username, ctx.email));
                return p != null ? List.of(p) : List.of();
            }
        }

        return getAllPatients();
    }

    public List<Patient> getPatientsByHospital(String hospitalId) {
        return repository.findByHospitalIdIgnoreCase(hospitalId.trim());
    }

    public List<Patient> getPatientsBySpecialty(String specialty) {
        return repository.findBySpecialtyIgnoreCase(specialty.trim());
    }

    // ===========================================
    // Re-Assign Patient to Doctor / Hospital
    // ===========================================
    public String assignPatient(String patientId, Patient assignmentData) {
        Patient existing = getPatientById(patientId);
        if (existing == null) {
            return "Patient Not Found";
        }

        if (assignmentData.getAssignedDoctorId() != null) {
            existing.setAssignedDoctorId(resolveDoctorId(assignmentData.getAssignedDoctorId()));
        }
        if (assignmentData.getAssignedDoctorName() != null) {
            existing.setAssignedDoctorName(assignmentData.getAssignedDoctorName());
        }
        if (assignmentData.getSpecialty() != null) {
            existing.setSpecialty(assignmentData.getSpecialty());
        }
        if (assignmentData.getHospitalId() != null) {
            existing.setHospitalId(assignmentData.getHospitalId());
        }
        if (assignmentData.getHospitalName() != null) {
            existing.setHospitalName(assignmentData.getHospitalName());
        }
        if (assignmentData.getDepartment() != null) {
            existing.setDepartment(assignmentData.getDepartment());
        }
        if (assignmentData.getCondition() != null) {
            existing.setCondition(assignmentData.getCondition());
        }

        repository.save(existing);
        return "Patient Assignment Updated Successfully";
    }

    // ===========================================
    // Re-Assign Patient (Admin-Only, Secured)
    // ===========================================
    public String assignPatientSecured(String patientId, Patient assignmentData, jakarta.servlet.http.HttpServletRequest request) {
        SecurityUserContext ctx = parseSecurityContext(request);

        // No valid JWT token present
        if (ctx.username == null || ctx.username.trim().isEmpty()) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.UNAUTHORIZED,
                "Authentication required to assign patients"
            );
        }

        // Only ADMIN is permitted
        if (!ctx.isAdmin) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN,
                "Access Denied: Only ADMIN can reassign patients"
            );
        }

        return assignPatient(patientId, assignmentData);
    }

    // ===========================================
    // Idempotent Seed Data Loader
    // ===========================================
    public String seedPatients() {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

            java.io.InputStream inputStream = getClass().getResourceAsStream("/seed_assignment_patients.json");
            if (inputStream == null) {
                return "Seed resource /seed_assignment_patients.json not found";
            }

            List<Patient> seedList = mapper.readValue(
                inputStream,
                new com.fasterxml.jackson.core.type.TypeReference<List<Patient>>() {}
            );

            int insertedCount = 0;
            int updatedCount = 0;

            for (Patient seedPatient : seedList) {
                Patient existing = repository.findByPatientIdIgnoreCase(seedPatient.getPatientId()).orElse(null);
                if (existing == null) {
                    seedPatient.setCreatedAt(LocalDateTime.now());
                    repository.save(seedPatient);
                    insertedCount++;
                } else {
                    // Update assignment fields if missing
                    boolean updated = false;
                    if (existing.getAssignedDoctorId() == null) {
                        existing.setAssignedDoctorId(seedPatient.getAssignedDoctorId());
                        updated = true;
                    }
                    if (existing.getAssignedDoctorName() == null) {
                        existing.setAssignedDoctorName(seedPatient.getAssignedDoctorName());
                        updated = true;
                    }
                    if (existing.getHospitalId() == null) {
                        existing.setHospitalId(seedPatient.getHospitalId());
                        updated = true;
                    }
                    if (existing.getHospitalName() == null) {
                        existing.setHospitalName(seedPatient.getHospitalName());
                        updated = true;
                    }
                    if (existing.getSpecialty() == null) {
                        existing.setSpecialty(seedPatient.getSpecialty());
                        updated = true;
                    }
                    if (existing.getDepartment() == null) {
                        existing.setDepartment(seedPatient.getDepartment());
                        updated = true;
                    }
                    if (existing.getCondition() == null) {
                        existing.setCondition(seedPatient.getCondition());
                        updated = true;
                    }
                    if (updated) {
                        repository.save(existing);
                        updatedCount++;
                    }
                }
            }

            return String.format("Seeding complete. Inserted %d new patients, updated %d existing patients.", insertedCount, updatedCount);

        } catch (Exception ex) {
            ex.printStackTrace();
            return "Seeding failed: " + ex.getMessage();
        }
    }
}