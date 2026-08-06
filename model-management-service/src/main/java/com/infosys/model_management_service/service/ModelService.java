package com.infosys.model_management_service.service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.infosys.model_management_service.dto.ModelRequest;
import com.infosys.model_management_service.dto.ModelResponse;
import com.infosys.model_management_service.entity.ModelEntity;
import com.infosys.model_management_service.exception.ResourceNotFoundException;
import com.infosys.model_management_service.exception.ValidationException;
import com.infosys.model_management_service.repository.ModelRepository;

@Service
public class ModelService {

    private final ModelRepository modelRepository;

    public ModelService(ModelRepository modelRepository) {
        this.modelRepository = modelRepository;
    }

    public List<ModelResponse> getAllModels() {
        return modelRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ModelResponse getModelById(String modelId) {
        ModelEntity entity = modelRepository.findByModelId(modelId)
                .orElseThrow(() -> new ResourceNotFoundException("Model not found: " + modelId));
        return toResponse(entity);
    }

    public ModelResponse createModel(ModelRequest request) {
        validateRequest(request, null);

        if (modelRepository.existsByModelId(request.getModelId())) {
            throw new ValidationException("Duplicate modelId: " + request.getModelId());
        }
        if (modelRepository.existsByVersion(request.getVersion())) {
            throw new ValidationException("Duplicate version: " + request.getVersion());
        }

        ModelEntity entity = new ModelEntity();
        entity.setModelId(request.getModelId());
        entity.setModelName(request.getModelName());
        entity.setVersion(request.getVersion());
        entity.setFramework(request.getFramework());
        entity.setAccuracy(request.getAccuracy());
        entity.setPrecision(request.getPrecision());
        entity.setRecall(request.getRecall());
        entity.setStatus(request.getStatus() == null ? "INACTIVE" : request.getStatus().toUpperCase());
        entity.setDescription(request.getDescription());
        entity.setCreatedAt(Instant.now());

        return toResponse(modelRepository.save(entity));
    }

    public ModelResponse updateModel(String modelId, ModelRequest request) {
        ModelEntity entity = modelRepository.findByModelId(modelId)
                .orElseThrow(() -> new ResourceNotFoundException("Model not found: " + modelId));
        validateRequest(request, entity);

        if (!entity.getVersion().equals(request.getVersion()) && modelRepository.existsByVersion(request.getVersion())) {
            throw new ValidationException("Duplicate version: " + request.getVersion());
        }
        if (!entity.getModelId().equals(request.getModelId()) && modelRepository.existsByModelId(request.getModelId())) {
            throw new ValidationException("Duplicate modelId: " + request.getModelId());
        }

        entity.setModelId(request.getModelId());
        entity.setModelName(request.getModelName());
        entity.setVersion(request.getVersion());
        entity.setFramework(request.getFramework());
        entity.setAccuracy(request.getAccuracy());
        entity.setPrecision(request.getPrecision());
        entity.setRecall(request.getRecall());
        entity.setStatus(request.getStatus() == null ? entity.getStatus() : request.getStatus().toUpperCase());
        entity.setDescription(request.getDescription());

        return toResponse(modelRepository.save(entity));
    }

    public void deleteModel(String modelId) {
        ModelEntity entity = modelRepository.findByModelId(modelId)
                .orElseThrow(() -> new ResourceNotFoundException("Model not found: " + modelId));
        modelRepository.delete(entity);
    }

    public ModelResponse activateModel(String modelId) {
        ModelEntity entity = modelRepository.findByModelId(modelId)
                .orElseThrow(() -> new ResourceNotFoundException("Model not found: " + modelId));

        List<ModelEntity> activeModels = modelRepository.findByStatus("ACTIVE");
        for (ModelEntity active : activeModels) {
            if (!active.getModelId().equals(modelId)) {
                active.setStatus("INACTIVE");
                modelRepository.save(active);
            }
        }

        entity.setStatus("ACTIVE");
        return toResponse(modelRepository.save(entity));
    }

    public ModelResponse getActiveModel() {
        return modelRepository.findByStatus("ACTIVE").stream().findFirst()
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("No active model found"));
    }

    private void validateRequest(ModelRequest request, ModelEntity existing) {
        if (request.getModelId() == null || request.getModelId().isBlank()) {
            throw new ValidationException("modelId is required");
        }
        if (request.getModelName() == null || request.getModelName().isBlank()) {
            throw new ValidationException("modelName is required");
        }
        if (request.getVersion() == null || request.getVersion().isBlank()) {
            throw new ValidationException("version is required");
        }
        if (request.getFramework() == null || request.getFramework().isBlank()) {
            throw new ValidationException("framework is required");
        }
        if (request.getAccuracy() == null || request.getAccuracy() < 0 || request.getAccuracy() > 100) {
            throw new ValidationException("accuracy must be between 0 and 100");
        }
        if (request.getPrecision() == null || request.getPrecision() < 0 || request.getPrecision() > 100) {
            throw new ValidationException("precision must be between 0 and 100");
        }
        if (request.getRecall() == null || request.getRecall() < 0 || request.getRecall() > 100) {
            throw new ValidationException("recall must be between 0 and 100");
        }

        if (existing == null) {
            if (request.getStatus() != null && !List.of("ACTIVE", "INACTIVE").contains(request.getStatus().toUpperCase())) {
                throw new ValidationException("status must be ACTIVE or INACTIVE");
            }
        }
    }

    private ModelResponse toResponse(ModelEntity entity) {
        ModelResponse response = new ModelResponse();
        response.setId(entity.getId());
        response.setModelId(entity.getModelId());
        response.setModelName(entity.getModelName());
        response.setVersion(entity.getVersion());
        response.setFramework(entity.getFramework());
        response.setAccuracy(entity.getAccuracy());
        response.setPrecision(entity.getPrecision());
        response.setRecall(entity.getRecall());
        response.setStatus(entity.getStatus());
        response.setCreatedAt(entity.getCreatedAt());
        response.setDescription(entity.getDescription());
        return response;
    }
}
