package com.medisphere.predictionservice.dto;

import java.util.Map;

public record FlaskRequest(Map<String, Object> features) {}
