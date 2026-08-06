package com.infosys.model_management_service.dto;

import java.time.Instant;

import lombok.Data;

@Data
public class ModelResponse {
    private String id;
    private String modelId;
    private String modelName;
    private String version;
    private String framework;
    private Double accuracy;
    private Double precision;
    private Double recall;
    private String status;
    private Instant createdAt;
    private String description;
}
