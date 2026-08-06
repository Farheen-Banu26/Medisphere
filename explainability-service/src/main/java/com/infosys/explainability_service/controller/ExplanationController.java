package com.infosys.explainability_service.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.infosys.explainability_service.dto.ExplanationResponse;
import com.infosys.explainability_service.service.ExplanationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/explanation")
@Tag(name = "Explainability", description = "Generate and retrieve patient explainability insights")
public class ExplanationController {

    private final ExplanationService explanationService;

    public ExplanationController(ExplanationService explanationService) {
        this.explanationService = explanationService;
    }

    @Operation(summary = "Generate an explanation for a patient")
    @PostMapping("/{patientId}")
    public ResponseEntity<ExplanationResponse> generateExplanation(@PathVariable String patientId) {
        ExplanationResponse response = explanationService.generateExplanation(patientId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get the stored explanation for a patient")
    @GetMapping("/{patientId}")
    public ResponseEntity<ExplanationResponse> getExplanation(@PathVariable String patientId) {
        ExplanationResponse response = explanationService.getExplanation(patientId);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }
}
