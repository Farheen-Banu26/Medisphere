package com.infosys.explainability_service.entity;

import java.time.Instant;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "explanations")
public class ExplanationEntity {

    @Id
    private String id;
    private String patientId;
    private String risk;
    private List<String> topFactors;
    private List<String> factors;
    private Instant createdAt;
}
