package com.infosys.fhir_service.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.infosys.fhir_service.model.FhirPatient;

public interface FhirRepository extends MongoRepository<FhirPatient, String> {

    List<FhirPatient> findByPatientId(String patientId);

    List<FhirPatient> findByPatientIdIgnoreCase(String patientId);

    java.util.Optional<FhirPatient> findByPatientIdIgnoreCaseAndResourceType(String patientId, String resourceType);

}