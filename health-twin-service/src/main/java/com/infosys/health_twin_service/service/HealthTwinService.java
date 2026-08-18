package com.infosys.health_twin_service.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.infosys.health_twin_service.client.ConsentClient;
import com.infosys.health_twin_service.client.FhirClient;
import com.infosys.health_twin_service.client.PatientClient;
import com.infosys.health_twin_service.client.VitalsClient;
import com.infosys.health_twin_service.dto.Patient360Response;
import com.infosys.health_twin_service.dto.VitalMessage;
import com.infosys.health_twin_service.model.HealthTwin;
import com.infosys.health_twin_service.repository.HealthTwinRepository;

@Service
public class HealthTwinService {

    @Autowired
    private HealthTwinRepository repository;

    @Autowired
    private PatientClient patientClient;

    @Autowired
    private VitalsClient vitalsClient;

    @Autowired
    private ConsentClient consentClient;

    @Autowired
    private FhirClient fhirClient;

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
        if (doctorIdentifier == null || doctorIdentifier.trim().isEmpty()) return "D001";
        String normalized = doctorIdentifier.trim().toLowerCase();
        switch (normalized) {
            case "doctor": case "d001": case "dr_jenkins": return "D001";
            case "dr_smith": case "d002": return "D002";
            case "dr_jones": case "d003": return "D003";
            case "dr_patel": case "d004": return "D004";
            case "dr_chen": case "d005": return "D005";
            default: return doctorIdentifier.toUpperCase();
        }
    }

    public String resolvePatientId(String username, String email) {
        if ("patient".equalsIgnoreCase(username) || "patient@medisphere.com".equalsIgnoreCase(email)) return "P1002";
        if ("farheen".equalsIgnoreCase(username) || "banufarheen786786@gmail.com".equalsIgnoreCase(email)) return "P1001";
        if (username != null && !username.trim().isEmpty()) return username.trim().toUpperCase();
        return "P1002";
    }

    public boolean isPatientAssignedToDoctor(String docId, String targetPatientId) {
        String doc = resolveDoctorId(docId);
        String p = targetPatientId.toUpperCase().trim();
        if ("D001".equals(doc)) {
            return p.equals("P1001") || p.equals("P1002") ||
                   p.equals("PT00001") || p.equals("PT00002") || p.equals("PT00003") || p.equals("PT00004") ||
                   p.equals("PT00005") || p.equals("PT00006") || p.equals("PT00007") || p.equals("PT00008") ||
                   p.equals("PT00039") || p.equals("PT00040");
        } else if ("D002".equals(doc)) {
            return p.equals("PT00009") || p.equals("PT00010") || p.equals("PT00011") || p.equals("PT00012") ||
                   p.equals("PT00013") || p.equals("PT00014") || p.equals("PT00015") || p.equals("PT00016") ||
                   p.equals("PT00041") || p.equals("PT00042");
        } else if ("D003".equals(doc)) {
            return p.equals("PT00017") || p.equals("PT00018") || p.equals("PT00019") || p.equals("PT00020") ||
                   p.equals("PT00021") || p.equals("PT00022") || p.equals("PT00023") || p.equals("PT00024") ||
                   p.equals("PT00043") || p.equals("PT00044");
        } else if ("D004".equals(doc)) {
            return p.equals("PT00025") || p.equals("PT00026") || p.equals("PT00027") || p.equals("PT00028") ||
                   p.equals("PT00029") || p.equals("PT00030") || p.equals("PT00031") ||
                   p.equals("PT00045") || p.equals("PT00046");
        } else if ("D005".equals(doc)) {
            return p.equals("PT00032") || p.equals("PT00033") || p.equals("PT00034") || p.equals("PT00035") ||
                   p.equals("PT00036") || p.equals("PT00037") || p.equals("PT00038") ||
                   p.equals("PT00047") || p.equals("PT00048");
        }
        return false;
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
                    "Access Denied: Patient " + myPatientId + " cannot access Patient " + targetPatientId + " Health Twin"
                );
            }
        } else if (ctx.isDoctor) {
            String docId = resolveDoctorId(ctx.username);
            if (!isPatientAssignedToDoctor(docId, targetPatientId)) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Access Denied: Doctor " + docId + " cannot access Patient " + targetPatientId + " Health Twin"
                );
            }
        }
    }

    public String createTwin(HealthTwin twin) {
        String patientId = normalizePatientId(twin.getPatientId());
        if (patientId.isBlank()) {
            return "Invalid patient ID";
        }

        if (repository.findByPatientIdIgnoreCase(patientId).isPresent()) {
            return "Health Twin already exists";
        }

        HealthTwin newTwin = createDefaultTwin(patientId);
        applyIncomingPayload(newTwin, twin);
        newTwin.setLastUpdated(LocalDateTime.now());
        applyDerivedMetrics(newTwin);
        repository.save(newTwin);

        return "Health Twin Created Successfully";
    }

    public HealthTwin getTwin(String patientId) {
        String normalizedPatientId = normalizePatientId(patientId);
        HealthTwin twin = null;
        try {
            twin = repository.findByPatientIdIgnoreCase(normalizedPatientId).orElse(null);
        } catch (Exception e) {
            System.err.println("HealthTwinService getTwin repository error: " + e.getMessage());
        }
        if (twin == null) {
            twin = createDefaultTwin(normalizedPatientId);
        }
        return twin;
    }

    public String updateTwin(String patientId, HealthTwin twin) {
        String normalizedPatientId = normalizePatientId(patientId);
        HealthTwin existingTwin = null;
        try {
            existingTwin = repository.findByPatientIdIgnoreCase(normalizedPatientId).orElse(null);
        } catch (Exception e) {
            System.err.println("HealthTwinService updateTwin repository error: " + e.getMessage());
        }

        if (existingTwin == null) {
            return "Health Twin Not Found";
        }

        applyIncomingPayload(existingTwin, twin);
        existingTwin.setPatientId(normalizedPatientId);
        existingTwin.setLastUpdated(LocalDateTime.now());
        applyDerivedMetrics(existingTwin);
        try {
            repository.save(existingTwin);
        } catch (Exception e) {
            System.err.println("HealthTwinService save error: " + e.getMessage());
        }

        return "Health Twin Updated Successfully";
    }

    public double calculateHealthScore(String patientId) {
        String normalizedPatientId = normalizePatientId(patientId);
        HealthTwin twin = null;
        try {
            twin = repository.findByPatientIdIgnoreCase(normalizedPatientId).orElse(null);
        } catch (Exception ignored) {}

        if (twin == null) {
            return -1;
        }

        return twin.getHealthScore() > 0.0 ? twin.getHealthScore() : Math.max(0.0, 100.0 - twin.getRiskScore());
    }

    public void updateVitals(VitalMessage message) {
        if (message == null || normalizePatientId(message.getPatientId()).isBlank()) {
            return;
        }

        String patientId = normalizePatientId(message.getPatientId());
        HealthTwin twin = null;
        try {
            twin = repository.findByPatientIdIgnoreCase(patientId).orElse(null);
        } catch (Exception ignored) {}
        if (twin == null) {
            twin = createDefaultTwin(patientId);
        }

        twin.setHeartRate(message.getHeartRate());
        if (message.getBpSystolic() > 0 || message.getBpDiastolic() > 0) {
            twin.setSystolicBP(message.getBpSystolic());
            twin.setDiastolicBP(message.getBpDiastolic());
            twin.setBloodPressure(message.getBpSystolic() + "/" + message.getBpDiastolic());
        }
        double rawMessageTemperature = message.getTemperature();
        double normalizedTemperature = normalizeTemperature(rawMessageTemperature);
        twin.setTemperature(normalizedTemperature);
        System.out.println("HealthTwinService: message temperature=" + rawMessageTemperature + " normalized=" + normalizedTemperature);
        twin.setOxygen(message.getSpo2());
        twin.setSteps(message.getSteps());
        twin.setSleepHours(message.getSleepHours());
        twin.setLastUpdated(LocalDateTime.now());
        applyDerivedMetrics(twin);

        try {
            repository.save(twin);
        } catch (Exception e) {
            System.err.println("HealthTwinService updateVitals save error: " + e.getMessage());
        }
    }

    public Patient360Response getPatient360Summary(String patientId) {
        String normalizedPatientId = normalizePatientId(patientId);

        Object patient = null;
        try {
            patient = patientClient.getPatient(normalizedPatientId);
        } catch (Exception e) {
            System.err.println("HealthTwinService patientClient error: " + e.getMessage());
        }

        HealthTwin healthTwin = null;
        try {
            healthTwin = repository.findByPatientIdIgnoreCase(normalizedPatientId).orElse(null);
        } catch (Exception e) {
            System.err.println("HealthTwinService repository error: " + e.getMessage());
        }
        if (healthTwin == null) {
            healthTwin = createDefaultTwin(normalizedPatientId);
        }

        Object latestVitals = null;
        try {
            latestVitals = vitalsClient.getLatestVitals(normalizedPatientId);
        } catch (Exception e) {
            System.err.println("HealthTwinService vitalsClient error: " + e.getMessage());
        }

        Object consent = null;
        try {
            consent = consentClient.getConsent(normalizedPatientId);
        } catch (Exception e) {
            System.err.println("HealthTwinService consentClient error: " + e.getMessage());
        }

        Object fhirResources = new ArrayList<>();
        try {
            Object res = fhirClient.getFhirResources(normalizedPatientId);
            if (res != null) {
                fhirResources = res;
            }
        } catch (Exception e) {
            System.err.println("HealthTwinService fhirClient error: " + e.getMessage());
        }

        return new Patient360Response(
                patient,
                healthTwin,
                latestVitals,
                consent,
                fhirResources
        );
    }

    private double normalizeTemperature(double temperature) {
        if (temperature > 45.0) {
            double celsius = (temperature - 32.0) * 5.0 / 9.0;
            return Math.round(celsius * 10.0) / 10.0;
        }
        return temperature;
    }

    private HealthTwin createDefaultTwin(String patientId) {
        HealthTwin twin = new HealthTwin();
        twin.setPatientId(patientId);
        twin.setHeight(0.0);
        twin.setWeight(0.0);
        twin.setBloodGroup("");
        twin.setAllergies(new ArrayList<>());
        twin.setChronicDiseases(new ArrayList<>());
        twin.setCurrentMedications(new ArrayList<>());
        twin.setHeartRate(0);
        twin.setTemperature(0.0);
        twin.setOxygen(0);
        twin.setSteps(0);
        twin.setSleepHours(0.0);
        twin.setRiskScore(0.0);
        twin.setHealthScore(100.0);
        twin.setBmi(0.0);
        twin.setLastUpdated(LocalDateTime.now());
        populatePatientProfile(twin);
        applyDerivedMetrics(twin);
        try {
            repository.save(twin);
        } catch (Exception e) {
            System.err.println("HealthTwinService createDefaultTwin save error: " + e.getMessage());
        }
        return twin;
    }

    private void applyIncomingPayload(HealthTwin target, HealthTwin incoming) {
        if (incoming == null) {
            return;
        }

        if (incoming.getPatientId() != null && !incoming.getPatientId().isBlank()) {
            target.setPatientId(normalizePatientId(incoming.getPatientId()));
        }
        if (incoming.getAge() != null) {
            target.setAge(incoming.getAge());
        }
        if (incoming.getGender() != null && !incoming.getGender().isBlank()) {
            target.setGender(incoming.getGender());
        }
        if (incoming.getHeight() != null && incoming.getHeight() > 0.0) {
            target.setHeight(incoming.getHeight());
        }
        if (incoming.getWeight() != null && incoming.getWeight() > 0.0) {
            target.setWeight(incoming.getWeight());
        }
        if (incoming.getBmi() != null && incoming.getBmi() > 0.0) {
            target.setBmi(incoming.getBmi());
        }
        if (incoming.getCholesterol() != null) {
            target.setCholesterol(incoming.getCholesterol());
        }
        if (incoming.getBloodGlucose() != null) {
            target.setBloodGlucose(incoming.getBloodGlucose());
        }
        if (incoming.getHbA1c() != null) {
            target.setHbA1c(incoming.getHbA1c());
        }
        if (incoming.getSmokingHistory() != null && !incoming.getSmokingHistory().isBlank()) {
            target.setSmokingHistory(incoming.getSmokingHistory());
        }
        if (incoming.getFamilyHistory() != null && !incoming.getFamilyHistory().isBlank()) {
            target.setFamilyHistory(incoming.getFamilyHistory());
        }
        if (incoming.getHeartDiseaseRisk() != null) {
            target.setHeartDiseaseRisk(incoming.getHeartDiseaseRisk());
        }
        if (incoming.getDiabetesRisk() != null) {
            target.setDiabetesRisk(incoming.getDiabetesRisk());
        }
        if (incoming.getConfidence() != null) {
            target.setConfidence(incoming.getConfidence());
        }
        if (incoming.getPredictionDate() != null) {
            target.setPredictionDate(incoming.getPredictionDate());
        }
        if (incoming.getBloodGroup() != null) {
            target.setBloodGroup(incoming.getBloodGroup());
        }
        if (incoming.getAllergies() != null) {
            target.setAllergies(incoming.getAllergies());
        }
        if (incoming.getChronicDiseases() != null) {
            target.setChronicDiseases(incoming.getChronicDiseases());
        }
        if (incoming.getCurrentMedications() != null) {
            target.setCurrentMedications(incoming.getCurrentMedications());
        }
        if (incoming.getHeartRate() != null && incoming.getHeartRate() > 0) {
            target.setHeartRate(incoming.getHeartRate());
        }
        if (incoming.getSystolicBP() != null) {
            target.setSystolicBP(incoming.getSystolicBP());
        }
        if (incoming.getDiastolicBP() != null) {
            target.setDiastolicBP(incoming.getDiastolicBP());
        }
        if (incoming.getBloodPressure() != null && !incoming.getBloodPressure().isBlank()) {
            target.setBloodPressure(incoming.getBloodPressure());
        }
        if (incoming.getTemperature() != null && incoming.getTemperature() > 0.0) {
            target.setTemperature(normalizeTemperature(incoming.getTemperature()));
        }
        if (incoming.getOxygen() != null && incoming.getOxygen() > 0) {
            target.setOxygen(incoming.getOxygen());
        }
        if (incoming.getSteps() != null && incoming.getSteps() > 0) {
            target.setSteps(incoming.getSteps());
        }
        if (incoming.getSleepHours() != null && incoming.getSleepHours() > 0.0) {
            target.setSleepHours(incoming.getSleepHours());
        }
        
        if (incoming.getRiskScore() != null && incoming.getRiskScore() > 0.0) {
            target.setRiskScore(incoming.getRiskScore());
        }
        if (incoming.getHealthScore() != null && incoming.getHealthScore() > 0.0) {
            target.setHealthScore(incoming.getHealthScore());
        }
    }

    private void applyDerivedMetrics(HealthTwin twin) {
        if (twin.getHeight() != null &&
    twin.getWeight() != null &&
    twin.getHeight() > 0.0 &&
    twin.getWeight() > 0.0)  {
            twin.setBmi(calculateBmi(twin.getHeight(), twin.getWeight()));
        } else if (twin.getBmi() == null || twin.getBmi() == 0.0) { {
            twin.setBmi(0.0);
        }

        if (twin.getBloodPressure() == null || twin.getBloodPressure().isBlank()) {
            if (twin.getSystolicBP() != null && twin.getDiastolicBP() != null) {
                twin.setBloodPressure(twin.getSystolicBP() + "/" + twin.getDiastolicBP());
            }
        }

        if (twin.getHealthScore() != null &&
    twin.getRiskScore() != null &&
    twin.getHealthScore() == 0.0 &&
    twin.getRiskScore() > 0.0)  {
            twin.setHealthScore(Math.max(0.0, 100.0 - twin.getRiskScore()));
        }
        if (twin.getHeartDiseaseRisk() == null &&
    twin.getRiskScore() != null &&
    twin.getRiskScore() > 0.0) {
            twin.setHeartDiseaseRisk(twin.getRiskScore());
        }
        if (twin.getPredictionDate() == null) {
            twin.setPredictionDate(LocalDateTime.now());
        }
    
        }}

    private double calculateBmi(double heightCm, double weightKg) {
        if (heightCm <= 0.0 || weightKg <= 0.0) {
            return 0.0;
        }
        double heightInMeters = heightCm / 100.0;
        double bmi = weightKg / (heightInMeters * heightInMeters);
        return Math.round(bmi * 10.0) / 10.0;
    }

    private void populatePatientProfile(HealthTwin twin) {
        if (twin.getPatientId() == null || twin.getPatientId().isBlank()) {
            return;
        }

        try {
            Object patient = patientClient.getPatient(twin.getPatientId());
            if (!(patient instanceof Map<?, ?> map)) {
                return;
            }

            Object ageValue = map.get("age");
            if (ageValue instanceof Number number) {
                twin.setAge(number.intValue());
            }

            Object genderValue = map.get("gender");
            if (genderValue != null) {
                twin.setGender(String.valueOf(genderValue));
            }

            Object heightValue = map.get("height");
            if (heightValue instanceof Number number) {
                twin.setHeight(number.doubleValue());
            }

            Object weightValue = map.get("weight");
            if (weightValue instanceof Number number) {
                twin.setWeight(number.doubleValue());
            }
        } catch (Exception ignored) {
            // Keep the default twin values if the patient service is unavailable.
        }
    }

    private String normalizePatientId(String patientId) {
        if (patientId == null) {
            return "";
        }
        return patientId.trim();
    }
}