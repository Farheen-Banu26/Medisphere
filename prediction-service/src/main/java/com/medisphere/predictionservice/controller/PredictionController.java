package com.medisphere.predictionservice.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medisphere.predictionservice.dto.PredictionRequest;
import com.medisphere.predictionservice.dto.PredictionResponse;
import com.medisphere.predictionservice.mapper.PredictionMapper;
import com.medisphere.predictionservice.model.RiskPrediction;
import com.medisphere.predictionservice.service.PredictionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class PredictionController {

    private final PredictionService service;
    private final Logger logger = LoggerFactory.getLogger(PredictionController.class);

    public PredictionController(PredictionService service) {
        this.service = service;
    }

    @PostMapping("/predictions")
    public ResponseEntity<PredictionResponse> createPrediction(@Valid @RequestBody PredictionRequest request) {
        logger.info("Prediction started for patient {}", request.patientId());
        RiskPrediction saved = service.predictAndSave(request.patientId());
        PredictionResponse response = PredictionMapper.toResponse(saved);
        logger.info("Prediction completed for patient {}", request.patientId());
        return ResponseEntity.ok(response);
    }
}
