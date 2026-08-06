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
        HealthTwin twin = repository.findByPatientIdIgnoreCase(normalizedPatientId).orElse(null);
        if (twin == null) {
            twin = createDefaultTwin(normalizedPatientId);
        }
        return twin;
    }

    public String updateTwin(String patientId, HealthTwin twin) {
        String normalizedPatientId = normalizePatientId(patientId);
        HealthTwin existingTwin = repository.findByPatientIdIgnoreCase(normalizedPatientId).orElse(null);

        if (existingTwin == null) {
            return "Health Twin Not Found";
        }

        applyIncomingPayload(existingTwin, twin);
        existingTwin.setPatientId(normalizedPatientId);
        existingTwin.setLastUpdated(LocalDateTime.now());
        applyDerivedMetrics(existingTwin);
        repository.save(existingTwin);

        return "Health Twin Updated Successfully";
    }

    public double calculateHealthScore(String patientId) {
        String normalizedPatientId = normalizePatientId(patientId);
        HealthTwin twin = repository.findByPatientIdIgnoreCase(normalizedPatientId).orElse(null);

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
        HealthTwin twin = repository.findByPatientIdIgnoreCase(patientId).orElse(null);
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

        repository.save(twin);
    }

    public Patient360Response getPatient360Summary(String patientId) {
        String normalizedPatientId = normalizePatientId(patientId);

        Object patient = patientClient.getPatient(normalizedPatientId);

        HealthTwin healthTwin = repository.findByPatientIdIgnoreCase(normalizedPatientId).orElse(null);
        if (healthTwin == null) {
            healthTwin = createDefaultTwin(normalizedPatientId);
        }

        Object latestVitals = vitalsClient.getLatestVitals(normalizedPatientId);
        Object consent = consentClient.getConsent(normalizedPatientId);
        Object fhirResources = fhirClient.getFhirResources(normalizedPatientId);

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
        repository.save(twin);
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