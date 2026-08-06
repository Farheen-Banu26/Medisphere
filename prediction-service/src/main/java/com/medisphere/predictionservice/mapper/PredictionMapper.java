package com.medisphere.predictionservice.mapper;

import com.medisphere.predictionservice.dto.PredictionResponse;
import com.medisphere.predictionservice.model.RiskPrediction;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Map;

public class PredictionMapper {

    public static RiskPrediction toEntity(String patientId, Map<String, Object> flaskMap) {
        @SuppressWarnings("unchecked")
        Map<String, Object> heart = (Map<String, Object>) flaskMap.get("heartDisease");
        @SuppressWarnings("unchecked")
        Map<String, Object> diabetes = (Map<String, Object>) flaskMap.get("diabetes");

        double heartProb = ((Number) heart.get("probability")).doubleValue();
        double diabetesProb = ((Number) diabetes.get("probability")).doubleValue();
        double heartConf = ((Number) heart.get("confidence")).doubleValue();
        double diabetesConf = ((Number) diabetes.get("confidence")).doubleValue();
        String heartPred = (String) heart.get("prediction");
        String diabetesPred = (String) diabetes.get("prediction");

        return new RiskPrediction(
                patientId,
                heartPred,
                heartProb,
                heartConf,
                diabetesPred,
                diabetesProb,
                diabetesConf,
                Instant.now()
        );
    }

    public static PredictionResponse toResponse(RiskPrediction entity) {
        String when = DateTimeFormatter.ISO_INSTANT.withZone(ZoneOffset.UTC).format(entity.getPredictionDate());
        return new PredictionResponse(
                entity.getPatientId(),
                entity.getHeartDiseasePrediction(),
                entity.getHeartDiseaseProbability(),
                entity.getHeartDiseaseConfidence(),
                entity.getDiabetesPrediction(),
                entity.getDiabetesProbability(),
                entity.getDiabetesConfidence(),
                when
        );
    }
}
