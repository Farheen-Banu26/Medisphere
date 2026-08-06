package com.infosys.health_twin_service.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.infosys.health_twin_service.model.HealthTwin;

public interface HealthTwinRepository extends MongoRepository<HealthTwin, String> {

    Optional<HealthTwin> findByPatientId(String patientId);

    Optional<HealthTwin> findByPatientIdIgnoreCase(String patientId);

}