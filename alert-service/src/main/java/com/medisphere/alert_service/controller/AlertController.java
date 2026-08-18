package com.medisphere.alert_service.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medisphere.alert_service.dto.AcknowledgeAlertRequest;
import com.medisphere.alert_service.exception.AlertNotFoundException;
import com.medisphere.alert_service.model.Alert;
import com.medisphere.alert_service.service.AlertService;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    public List<Alert> getAllAlerts() {
        return alertService.findAll();
    }

    @GetMapping("/patient/{patientId}")
    public List<Alert> getPatientAlerts(@PathVariable String patientId, jakarta.servlet.http.HttpServletRequest request) {
        alertService.verifyPatientResourceAccess(patientId, request);
        return alertService.findByPatientId(patientId);
    }

    @GetMapping("/active")
    public List<Alert> getActiveAlerts() {
        return alertService.findActiveAlerts();
    }

    @GetMapping("/{alertId}")
    public ResponseEntity<Alert> getAlertById(@PathVariable String alertId, jakarta.servlet.http.HttpServletRequest request) {
        Alert alert = alertService.findByAlertId(alertId);
        if (alert == null) {
            throw new AlertNotFoundException("Alert not found with id: " + alertId);
        }
        if (alert.getPatientId() != null) {
            alertService.verifyPatientResourceAccess(alert.getPatientId(), request);
        }
        return ResponseEntity.ok(alert);
    }

    @PutMapping("/{alertId}/sent")
    public ResponseEntity<Alert> markSent(@PathVariable String alertId) {
        Alert updatedAlert = alertService.markSent(alertId);
        return ResponseEntity.ok(updatedAlert);
    }

    @PutMapping("/{alertId}/delivered")
    public ResponseEntity<Alert> markDelivered(@PathVariable String alertId) {
        Alert updatedAlert = alertService.markDelivered(alertId);
        return ResponseEntity.ok(updatedAlert);
    }

    @PutMapping("/{alertId}/acknowledge")
    public ResponseEntity<Alert> acknowledgeAlert(
            @PathVariable String alertId,
            @RequestBody(required = false) AcknowledgeAlertRequest request) {
        String acknowledgedBy = request != null ? request.getAcknowledgedBy() : null;
        Alert updatedAlert = alertService.acknowledgeAlert(alertId, acknowledgedBy);
        return ResponseEntity.ok(updatedAlert);
    }

    @PutMapping("/{alertId}/close")
    public ResponseEntity<Alert> closeAlert(@PathVariable String alertId) {
        Alert updatedAlert = alertService.closeAlert(alertId);
        return ResponseEntity.ok(updatedAlert);
    }
}
