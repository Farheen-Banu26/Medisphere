package com.medisphere.predictionservice.dto;

public record PredictionResponse(
        String patientId,
        String heartDiseasePrediction,
        double heartDiseaseProbability,
        double heartDiseaseConfidence,
        String diabetesPrediction,
        double diabetesProbability,
        double diabetesConfidence,
        String predictionDate
) {}
