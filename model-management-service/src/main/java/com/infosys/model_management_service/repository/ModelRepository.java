package com.infosys.model_management_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.infosys.model_management_service.entity.ModelEntity;

@Repository
public interface ModelRepository extends MongoRepository<ModelEntity, String> {
    Optional<ModelEntity> findByModelId(String modelId);
    List<ModelEntity> findByStatus(String status);
    boolean existsByModelId(String modelId);
    boolean existsByVersion(String version);
}
