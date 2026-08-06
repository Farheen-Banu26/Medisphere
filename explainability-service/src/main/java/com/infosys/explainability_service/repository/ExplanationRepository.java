package com.infosys.explainability_service.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.infosys.explainability_service.entity.ExplanationEntity;

@Repository
public interface ExplanationRepository extends MongoRepository<ExplanationEntity, String> {
    Optional<ExplanationEntity> findByPatientId(String patientId);
}
