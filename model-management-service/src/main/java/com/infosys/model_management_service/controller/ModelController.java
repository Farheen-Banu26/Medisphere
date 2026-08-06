package com.infosys.model_management_service.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.infosys.model_management_service.dto.ModelRequest;
import com.infosys.model_management_service.dto.ModelResponse;
import com.infosys.model_management_service.service.ModelService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/models")
@Tag(name = "Model Management", description = "Manage AI model metadata, versions, and deployment status")
public class ModelController {

    private final ModelService modelService;

    public ModelController(ModelService modelService) {
        this.modelService = modelService;
    }

    @Operation(summary = "Create a new AI model metadata record")
    @PostMapping
    public ResponseEntity<ModelResponse> createModel(@Valid @RequestBody ModelRequest request) {
        return ResponseEntity.ok(modelService.createModel(request));
    }

    @Operation(summary = "Get all AI models")
    @GetMapping
    public ResponseEntity<List<ModelResponse>> getAllModels() {
        return ResponseEntity.ok(modelService.getAllModels());
    }

    @Operation(summary = "Get an AI model by its modelId")
    @GetMapping("/{modelId}")
    public ResponseEntity<ModelResponse> getModelById(@PathVariable String modelId) {
        return ResponseEntity.ok(modelService.getModelById(modelId));
    }

    @Operation(summary = "Update an existing AI model metadata record")
    @PutMapping("/{modelId}")
    public ResponseEntity<ModelResponse> updateModel(@PathVariable String modelId, @Valid @RequestBody ModelRequest request) {
        return ResponseEntity.ok(modelService.updateModel(modelId, request));
    }

    @Operation(summary = "Delete an AI model metadata record")
    @DeleteMapping("/{modelId}")
    public ResponseEntity<Void> deleteModel(@PathVariable String modelId) {
        modelService.deleteModel(modelId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Activate a specific model and deactivate any previously active model")
    @PutMapping("/{modelId}/activate")
    public ResponseEntity<ModelResponse> activateModel(@PathVariable String modelId) {
        return ResponseEntity.ok(modelService.activateModel(modelId));
    }

    @Operation(summary = "Get the currently active AI model")
    @GetMapping("/active")
    public ResponseEntity<ModelResponse> getActiveModel() {
        return ResponseEntity.ok(modelService.getActiveModel());
    }
}
