package com.infosys.vitals_service.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.infosys.vitals_service.dto.VitalMessage;
import com.infosys.vitals_service.kafka.KafkaProducer;
import com.infosys.vitals_service.model.Vital;
import com.infosys.vitals_service.repository.VitalsRepository;

@Service
public class VitalsService {

    @Autowired
    private VitalsRepository repository;

    @Autowired
    private KafkaProducer kafkaProducer;

    private final RestTemplate restTemplate = new RestTemplate();

    // ===========================================
    // Security Context & Authorization Guards
    // ===========================================
    public static class SecurityUserContext {
        public String username;
        public String email;
        public java.util.List<String> roles = new java.util.ArrayList<>();
        public boolean isAdmin = false;
        public boolean isDoctor = false;
        public boolean isPatient = false;
    }

    public SecurityUserContext parseSecurityContext(jakarta.servlet.http.HttpServletRequest request) {
        SecurityUserContext ctx = new SecurityUserContext();
        if (request == null) return ctx;
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return ctx;
        String token = authHeader.substring(7).trim();
        String[] parts = token.split("\\.");
        if (parts.length < 2) return ctx;
        try {
            String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(parts[1]), java.nio.charset.StandardCharsets.UTF_8);
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(payloadJson);
            if (root.has("preferred_username")) ctx.username = root.get("preferred_username").asText();
            if (root.has("email")) ctx.email = root.get("email").asText();
            if (root.has("realm_access") && root.get("realm_access").has("roles")) {
                for (com.fasterxml.jackson.databind.JsonNode r : root.get("realm_access").get("roles")) {
                    String role = r.asText().toUpperCase();
                    ctx.roles.add(role);
                    if ("ADMIN".equals(role)) ctx.isAdmin = true;
                    if ("DOCTOR".equals(role)) ctx.isDoctor = true;
                    if ("PATIENT".equals(role)) ctx.isPatient = true;
                }
            }
        } catch (Exception ex) {}
        return ctx;
    }

    public String resolveDoctorId(String doctorIdentifier) {
        // Normalise common username aliases to doctorId format.
        // For new registrations the doctorId stored in the patient record is authoritative.
        if (doctorIdentifier == null || doctorIdentifier.trim().isEmpty()) return "D001";
        String normalized = doctorIdentifier.trim().toLowerCase();
        return switch (normalized) {
            case "doctor", "d001", "dr_jenkins" -> "D001";
            case "dr_smith", "d002"             -> "D002";
            case "dr_jones", "d003"             -> "D003";
            case "dr_patel", "d004"             -> "D004";
            case "dr_chen",  "d005"             -> "D005";
            default -> doctorIdentifier.toUpperCase();
        };
    }

    public String resolvePatientId(String username, String email) {
        if ("patient".equalsIgnoreCase(username) || "patient@medisphere.com".equalsIgnoreCase(email)) return "P1002";
        if ("farheen".equalsIgnoreCase(username) || "banufarheen786786@gmail.com".equalsIgnoreCase(email)) return "P1001";
        if (username != null && !username.trim().isEmpty()) return username.trim().toUpperCase();
        return "P1002";
    }

    /**
     * Checks whether a patient is assigned to a given doctor using the patient-service
     * database (patient.assignedDoctorId field). Falls back to permitting access if the
     * patient-service is unreachable, so that a transient failure does not block clinical
     * workflows entirely — this is a deliberate healthcare safety trade-off.
     */
    @org.springframework.beans.factory.annotation.Value("${patient.service.base-url:http://localhost:8989}")
    private String patientServiceBaseUrl;

    public boolean isPatientAssignedToDoctor(String docId, String targetPatientId) {
        try {
            String baseUrl = (patientServiceBaseUrl != null && !patientServiceBaseUrl.trim().isEmpty()) ? patientServiceBaseUrl : "http://localhost:8989";
            String url = baseUrl + "/api/patients/" + targetPatientId;
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> patient = restTemplate.getForObject(url, java.util.Map.class);
            if (patient == null) return false;
            Object assignedDoctorId = patient.get("assignedDoctorId");
            if (assignedDoctorId == null) return false;
            String assignedId = assignedDoctorId.toString();
            return assignedId.equalsIgnoreCase(docId) || assignedId.equalsIgnoreCase(resolveDoctorId(docId));
        } catch (org.springframework.web.client.HttpClientErrorException.NotFound ex) {
            return false;
        } catch (Exception ex) {
            System.err.println("VitalsService: patient-service lookup failed for assignment check: " + ex.getMessage());
            return false;
        }
    }

    public void verifyPatientResourceAccess(String targetPatientId, jakarta.servlet.http.HttpServletRequest request) {
        SecurityUserContext ctx = parseSecurityContext(request);
        if (ctx.username == null || ctx.username.trim().isEmpty()) return;

        if (ctx.isAdmin) return;

        if (ctx.isPatient) {
            String myPatientId = resolvePatientId(ctx.username, ctx.email);
            if (!targetPatientId.equalsIgnoreCase(myPatientId)) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Access Denied: Patient " + myPatientId + " cannot access Patient " + targetPatientId + " Vitals"
                );
            }
        } else if (ctx.isDoctor) {
            String docId = resolveDoctorId(ctx.username);
            if (!isPatientAssignedToDoctor(docId, targetPatientId)) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Access Denied: Doctor " + docId + " cannot access Patient " + targetPatientId + " Vitals"
                );
            }
        }
    }

    // Add Vitals
    public String addVitals(Vital vital) {

        // Ensure timestamp is non-null
        if (vital.getRecordedAt() == null) {
            vital.setRecordedAt(java.time.LocalDateTime.now());
        }

        // Normalize the temperature to Celsius before saving and publishing
        double rawTemperature = vital.getTemperature();
        double normalizedTemperature = normalizeTemperature(rawTemperature);
        vital.setTemperature(normalizedTemperature);

        System.out.println("VitalsService: vitals MongoDB temperature=" + normalizedTemperature + " (raw input=" + rawTemperature + ")");

        // Save to MongoDB
        repository.save(vital);

        // Create Kafka DTO
        VitalMessage message = new VitalMessage(
                vital.getPatientId(),
                vital.getHeartRate(),
                vital.getBpSystolic(),
                vital.getBpDiastolic(),
                normalizedTemperature,
                vital.getSpo2(),
                vital.getSteps(),
                vital.getSleepHours(),
                vital.getRespirationRate());

        // Send to Kafka
        kafkaProducer.sendMessage(message);

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("action", "RECORD_VITALS");
            payload.put("user", "system");
            payload.put("role", "SYSTEM");
            payload.put("patientId", vital.getPatientId());
            payload.put("status", "SUCCESS");
            payload.put("details", "Vitals recorded successfully");

            restTemplate.postForEntity(
                    "http://localhost:8994/api/audit/logs",
                    payload,
                    String.class);

        } catch (RuntimeException ex) {
            System.out.println("Audit log write failed: " + ex.getMessage());
        }

        return "Vitals Saved Successfully";
    }

    // Get All Vitals
    public List<Vital> getAllVitals() {
        return repository.findAll();
    }

    // Get Patient Vitals
    public List<Vital> getVitalsByPatient(String patientId) {
        return repository.findByPatientIdIgnoreCase(patientId.trim());
    }

    // Get Latest Vitals
    public Vital getLatestVitals(String patientId) {
        if (patientId == null || patientId.trim().isEmpty()) return null;
        String trimmed = patientId.trim();
        Vital latest = repository.findTopByPatientIdOrderByRecordedAtDesc(trimmed);
        if (latest != null) {
            return latest;
        }
        List<Vital> list = repository.findByPatientIdIgnoreCase(trimmed);
        if (list != null && !list.isEmpty()) {
            return list.stream()
                    .filter(v -> v.getRecordedAt() != null)
                    .max(java.util.Comparator.comparing(Vital::getRecordedAt))
                    .orElse(list.get(list.size() - 1));
        }
        return null;
    }

    // Delete Vitals
    public String deleteVitals(String id) {
        repository.deleteById(id);
        return "Vitals Deleted Successfully";
    }

    private double normalizeTemperature(double temperature) {
        if (temperature > 45.0) {
            double celsius = (temperature - 32.0) * 5.0 / 9.0;
            return Math.round(celsius * 10.0) / 10.0;
        }
        return temperature;
    }
}