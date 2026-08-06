package com.infosys.fhir_service.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.infosys.fhir_service.model.FhirSyncHistory;

public interface FhirSyncHistoryRepository extends MongoRepository<FhirSyncHistory, String> {
    List<FhirSyncHistory> findByPatientIdOrderByStartedAtDesc(String patientId);
    List<FhirSyncHistory> findAllByOrderByStartedAtDesc();
}
