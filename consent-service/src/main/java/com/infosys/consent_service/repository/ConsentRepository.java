package com.infosys.consent_service.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.infosys.consent_service.model.Consent;

public interface ConsentRepository extends MongoRepository<Consent, String> {

    Optional<Consent> findByPatientId(String patientId);

    Optional<Consent> findByPatientIdIgnoreCase(String patientId);

}