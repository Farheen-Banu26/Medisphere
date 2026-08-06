package com.medisphere.careplan_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.medisphere.careplan_service.model.CarePlan;
import com.medisphere.careplan_service.model.DoctorStatus;

/**
 * MongoDB repository for the CarePlan collection.
 * Spring Data derives queries from method names automatically.
 */
@Repository
public interface CarePlanRepository extends MongoRepository<CarePlan, String> {

    /** Find a care plan by its business identifier. */
    Optional<CarePlan> findByCarePlanId(String carePlanId);

    /** Retrieve the latest care plan for a patient (most recent first). */
    List<CarePlan> findByPatientIdOrderByCreatedAtDesc(String patientId);

    /** Retrieve care plans for a patient filtered by doctor status. */
    List<CarePlan> findByPatientIdAndDoctorStatusOrderByCreatedAtDesc(
            String patientId, DoctorStatus doctorStatus);

    /** Retrieve all care plans with a specific doctor status (e.g. PENDING). */
    List<CarePlan> findByDoctorStatusOrderByCreatedAtDesc(DoctorStatus doctorStatus);
}
