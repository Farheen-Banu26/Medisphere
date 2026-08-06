package com.medisphere.careplan_service.client;

import java.util.Map;

public record FlaskResponse(
        String status,
        String predictionTime,
        Map<String, Object> heartDisease,
        Map<String, Object> diabetes
) {}
