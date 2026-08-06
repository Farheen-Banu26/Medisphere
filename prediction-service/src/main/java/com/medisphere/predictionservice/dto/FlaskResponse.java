package com.medisphere.predictionservice.dto;

import java.util.Map;

public record FlaskResponse(
        String status,
        String predictionTime,
        Map<String, Object> heartDisease,
        Map<String, Object> diabetes
) {}
