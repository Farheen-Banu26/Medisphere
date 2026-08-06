package com.infosys.vitals_service.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.infosys.vitals_service.model.Vital;

public interface VitalsRepository extends MongoRepository<Vital, String> {

    // Get all vitals for a patient
    List<Vital> findByPatientId(String patientId);

    // Get all vitals for a patient (case-insensitive)
    List<Vital> findByPatientIdIgnoreCase(String patientId);

    // Get the latest vital record for a patient
    Vital findTopByPatientIdOrderByRecordedAtDesc(String patientId);

}