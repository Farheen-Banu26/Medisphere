package com.infosys.ai_prediction_service.dto;

import lombok.Data;

@Data
public class PredictionResponse {

    private int prediction;
    private double probability;

}