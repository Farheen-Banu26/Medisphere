package com.infosys.health_twin_service.model;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Document(collection = "health_twins")
public class HealthTwin {

    @Id
    private String id;

    @Field("patientId")
    private String patientId;

    // ==========================
    // Patient Profile
    // ==========================
    private Integer age;

    private String gender;

    private Double height;

    private Double weight;

    // Automatically calculated
    private Double bmi;

    // ==========================
    // Clinical Information
    // ==========================
    private Double cholesterol;

    private Double bloodGlucose;

    private Double hbA1c;

    private String smokingHistory;

    private String familyHistory;

    // ==========================
    // AI Prediction Results
    // ==========================
    private Double heartDiseaseRisk;

    private Double diabetesRisk;

    private Double confidence;

    private LocalDateTime predictionDate;

    // ==========================
    // Medication / Allergy
    // ==========================
    private String bloodGroup;

    private List<String> allergies;

    private List<String> chronicDiseases;

    private List<String> currentMedications;

    // ==========================
    // Latest Vitals (Kafka)
    // ==========================
    private Integer heartRate;

    private Integer systolicBP;

    private Integer diastolicBP;

    @Deprecated
    private String bloodPressure;

    private Double temperature;

    private Integer oxygen;

    private Integer steps;

    private Double sleepHours;

    // ==========================
    // Health Summary
    // ==========================
    private Double riskScore;

    private Double healthScore;

    private LocalDateTime lastUpdated;
}