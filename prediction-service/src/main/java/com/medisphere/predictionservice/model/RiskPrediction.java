package com.medisphere.predictionservice.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "risk_predictions")
public class RiskPrediction {

    @Id
    private String id;
    private String patientId;

    private String heartDiseasePrediction;
    private double heartDiseaseProbability;
    private double heartDiseaseConfidence;

    private String diabetesPrediction;
    private double diabetesProbability;
    private double diabetesConfidence;

    private Instant predictionDate;

    public RiskPrediction() {}

    public RiskPrediction(String patientId,
                          String heartDiseasePrediction,
                          double heartDiseaseProbability,
                          double heartDiseaseConfidence,
                          String diabetesPrediction,
                          double diabetesProbability,
                          double diabetesConfidence,
                          Instant predictionDate) {
        this.patientId = patientId;
        this.heartDiseasePrediction = heartDiseasePrediction;
        this.heartDiseaseProbability = heartDiseaseProbability;
        this.heartDiseaseConfidence = heartDiseaseConfidence;
        this.diabetesPrediction = diabetesPrediction;
        this.diabetesProbability = diabetesProbability;
        this.diabetesConfidence = diabetesConfidence;
        this.predictionDate = predictionDate;
    }

    public String getId() { return id; }
    public String getPatientId() { return patientId; }
    public String getHeartDiseasePrediction() { return heartDiseasePrediction; }
    public double getHeartDiseaseProbability() { return heartDiseaseProbability; }
    public double getHeartDiseaseConfidence() { return heartDiseaseConfidence; }
    public String getDiabetesPrediction() { return diabetesPrediction; }
    public double getDiabetesProbability() { return diabetesProbability; }
    public double getDiabetesConfidence() { return diabetesConfidence; }
    public Instant getPredictionDate() { return predictionDate; }

    public void setId(String id) { this.id = id; }
}
