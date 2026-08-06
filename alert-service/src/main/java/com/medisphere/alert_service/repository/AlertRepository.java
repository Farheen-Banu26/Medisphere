package com.medisphere.alert_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.medisphere.alert_service.model.Alert;
import com.medisphere.alert_service.model.AlertSeverity;
import com.medisphere.alert_service.model.AlertStatus;

@Repository
public interface AlertRepository extends MongoRepository<Alert, String> {

    List<Alert> findByPatientIdOrderByCreatedAtDesc(String patientId);

    List<Alert> findByStatusOrderByCreatedAtDesc(AlertStatus status);

    List<Alert> findBySeverityOrderByCreatedAtDesc(AlertSeverity severity);

    Optional<Alert> findByAlertId(String alertId);

    List<Alert> findByStatusNotOrderByCreatedAtDesc(AlertStatus status);

    List<Alert> findByPatientIdAndTypeAndStatusNot(String patientId, String type, AlertStatus status);
}
