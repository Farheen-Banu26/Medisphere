package com.infosys.ai_prediction_service.service;

import com.infosys.ai_prediction_service.dto.CvdRequest;
import com.infosys.ai_prediction_service.dto.DiabetesRequest;
import com.infosys.ai_prediction_service.dto.PredictionResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class PredictionService {

    private final RestTemplate restTemplate;
    private final String flaskBaseUrl;

    public PredictionService(
            RestTemplate restTemplate,
            @Value("${flask.api.base-url}") String flaskBaseUrl) {

        this.restTemplate = restTemplate;
        this.flaskBaseUrl = flaskBaseUrl;
    }

    public PredictionResponse predictCvd(CvdRequest request) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<CvdRequest> entity = new HttpEntity<>(request, headers);

        ResponseEntity<PredictionResponse> response =
                restTemplate.postForEntity(
                        flaskBaseUrl + "/predict/cvd",
                        entity,
                        PredictionResponse.class
                );

        return response.getBody();
    }

    public PredictionResponse predictDiabetes(DiabetesRequest request) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<DiabetesRequest> entity = new HttpEntity<>(request, headers);

        ResponseEntity<PredictionResponse> response =
                restTemplate.postForEntity(
                        flaskBaseUrl + "/predict/diabetes",
                        entity,
                        PredictionResponse.class
                );

        return response.getBody();
    }
}