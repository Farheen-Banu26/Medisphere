package com.infosys.ai_prediction_service.controller;

import com.infosys.ai_prediction_service.dto.CvdRequest;
import com.infosys.ai_prediction_service.dto.DiabetesRequest;
import com.infosys.ai_prediction_service.dto.PredictionResponse;
import com.infosys.ai_prediction_service.service.PredictionService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/predictions")
@CrossOrigin(origins = "*")
public class PredictionController {

    private final PredictionService predictionService;

    public PredictionController(PredictionService predictionService) {
        this.predictionService = predictionService;
    }

    @PostMapping("/cvd")
    public PredictionResponse predictCvd(@RequestBody CvdRequest request) {
        return predictionService.predictCvd(request);
    }

    @PostMapping("/diabetes")
    public PredictionResponse predictDiabetes(@RequestBody DiabetesRequest request) {
        return predictionService.predictDiabetes(request);
    }
}