package com.infosys.model_management_service.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ModelRequest {

    @NotBlank(message = "modelId is required")
    private String modelId;

    @NotBlank(message = "modelName is required")
    private String modelName;

    @NotBlank(message = "version is required")
    private String version;

    @NotBlank(message = "framework is required")
    private String framework;

    @NotNull(message = "accuracy is required")
    @DecimalMin(value = "0.0", message = "accuracy must be between 0 and 100")
    @DecimalMax(value = "100.0", message = "accuracy must be between 0 and 100")
    private Double accuracy;

    @NotNull(message = "precision is required")
    @DecimalMin(value = "0.0", message = "precision must be between 0 and 100")
    @DecimalMax(value = "100.0", message = "precision must be between 0 and 100")
    private Double precision;

    @NotNull(message = "recall is required")
    @DecimalMin(value = "0.0", message = "recall must be between 0 and 100")
    @DecimalMax(value = "100.0", message = "recall must be between 0 and 100")
    private Double recall;

    private String status = "INACTIVE";
    private String description;
}
