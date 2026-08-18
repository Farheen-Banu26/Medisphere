package com.infosys.Medisphere.App.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.infosys.Medisphere.App.model.Patient;
import java.util.Optional;

public interface PatientRepository extends MongoRepository<Patient, String> {

    Optional<Patient> findByPatientId(String patientId);

    Optional<Patient> findByPatientIdIgnoreCase(String patientId);

    java.util.List<Patient> findByAssignedDoctorIdIgnoreCase(String assignedDoctorId);

    java.util.List<Patient> findByHospitalIdIgnoreCase(String hospitalId);

    java.util.List<Patient> findBySpecialtyIgnoreCase(String specialty);

}