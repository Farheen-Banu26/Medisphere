package com.infosys.explainability_service.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.infosys.explainability_service.dto.ExplanationResponse;
import com.infosys.explainability_service.entity.ExplanationEntity;
import com.infosys.explainability_service.repository.ExplanationRepository;

@Service
public class ExplanationService {

    private final ExplanationRepository repository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    public ExplanationService(ExplanationRepository repository) {
        this.repository = repository;
    }

    public ExplanationResponse generateExplanation(String patientId) {
        if (patientId == null || patientId.isBlank()) {
            throw new IllegalArgumentException("patientId is required");
        }

        Map<String, Object> patient = getFromService("http://localhost:8080/api/patients/" + patientId);
        Map<String, Object> twin = getFromService("http://localhost:8080/api/twins/" + patientId);
        getFromService("http://localhost:8080/api/predictions/" + patientId);

        List<Map.Entry<String, Integer>> contributions = new ArrayList<>();

        Object bloodPressure = resolveValue(twin, "systolicBP");
        if (bloodPressure instanceof Number bp && bp.intValue() > 140) {
            contributions.add(Map.entry("Blood Pressure", 20));
        }

        Object hbA1c = resolveValue(twin, "hbA1c");
        if (hbA1c instanceof Number value && value.doubleValue() > 7) {
            contributions.add(Map.entry("HbA1c", 18));
        }

        Object bmi = resolveValue(twin, "bmi");
        if (bmi instanceof Number value && value.doubleValue() > 30) {
            contributions.add(Map.entry("BMI", 14));
        }

        Object heartRate = resolveValue(twin, "heartRate");
        if (heartRate instanceof Number value && value.intValue() > 110) {
            contributions.add(Map.entry("Heart Rate", 10));
        }

        Object age = resolveValue(patient, "age");
        if (age instanceof Number value && value.intValue() > 60) {
            contributions.add(Map.entry("Age", 8));
        }

        Object cholesterol = resolveValue(twin, "cholesterol");
        if (cholesterol instanceof Number value && value.doubleValue() > 220) {
            contributions.add(Map.entry("Cholesterol", 7));
        }

        contributions.sort(Comparator.comparingInt(Map.Entry<String, Integer>::getValue).reversed());

        List<String> factors = new ArrayList<>();
        List<String> topFactors = new ArrayList<>();
        for (Map.Entry<String, Integer> contribution : contributions) {
            factors.add(contribution.getKey() + " +" + contribution.getValue());
            topFactors.add(contribution.getKey());
        }

        String risk = "LOW";
        if (!contributions.isEmpty()) {
            int total = contributions.stream().mapToInt(Map.Entry::getValue).sum();
            if (total >= 35) {
                risk = "HIGH";
            } else if (total >= 20) {
                risk = "MEDIUM";
            }
        }

        ExplanationEntity entity = new ExplanationEntity();
        entity.setPatientId(patientId);
        entity.setRisk(risk);
        entity.setTopFactors(topFactors);
        entity.setFactors(factors);
        entity.setCreatedAt(Instant.now());
        repository.save(entity);

        return new ExplanationResponse(risk, factors);
    }

    public ExplanationResponse getExplanation(String patientId) {
        Optional<ExplanationEntity> entityOpt = repository.findByPatientId(patientId);
        if (entityOpt.isEmpty()) {
            return null;
        }
        ExplanationEntity entity = entityOpt.get();
        return new ExplanationResponse(entity.getRisk(), entity.getFactors());
    }

    private Map<String, Object> getFromService(String url) {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getBody() == null ? Map.of() : response.getBody();
        } catch (RuntimeException ex) {
            return Map.of();
        }
    }

    private Object resolveValue(Map<String, Object> source, String key) {
        if (source == null || source.isEmpty()) {
            return null;
        }

        Object value = source.get(key);
        if (value != null) {
            return value;
        }

        Object nested = source.get("data");
        if (nested instanceof Map<?, ?> nestedMap) {
            return nestedMap.get(key);
        }
        return null;
    }
}
