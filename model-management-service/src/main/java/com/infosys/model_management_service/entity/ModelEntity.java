package com.infosys.model_management_service.entity;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "models")
public class ModelEntity {

    @Id
    private String id;

    @Indexed(unique = true)
    private String modelId;

    private String modelName;

    @Indexed(unique = true)
    private String version;

    private String framework;
    private Double accuracy;
    private Double precision;
    private Double recall;
    private String status;
    private Instant createdAt;
    private String description;
}
