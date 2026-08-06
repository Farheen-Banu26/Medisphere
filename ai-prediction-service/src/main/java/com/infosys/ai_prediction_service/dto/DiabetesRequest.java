package com.infosys.ai_prediction_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
@Data
public class DiabetesRequest {

    private String gender;

    private int age;

    private int hypertension;

    @JsonProperty("heart_disease")
    private int heartDisease;

    @JsonProperty("smoking_history")
    private String smokingHistory;

    private double bmi;

    @JsonProperty("HbA1c_level")
    private double hbA1cLevel;

    @JsonProperty("blood_glucose_level")
    private int bloodGlucoseLevel;
}