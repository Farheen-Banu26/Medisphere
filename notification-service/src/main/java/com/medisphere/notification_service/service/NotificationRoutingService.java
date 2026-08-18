package com.medisphere.notification_service.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.medisphere.notification_service.dto.AlertEvent;
import com.medisphere.notification_service.dto.NotificationRoute;
import com.medisphere.notification_service.model.NotificationChannel;
import com.medisphere.notification_service.model.RecipientType;

/**
 * Determines notification routes based on:
 *  1. Alert severity  (CRITICAL/HIGH/MEDIUM/LOW)
 *  2. Alert type      (specialty routing — cardiac, diabetes, respiratory)
 *
 * Routing rules:
 *  CRITICAL                         → DOCTOR + NURSE + specialty queue
 *  HIGH                             → DOCTOR + specialty queue
 *  MEDIUM                           → NURSE
 *  LOW                              → PATIENT
 *
 * Specialty queues (added in addition to severity routes):
 *  Cardiac alerts                   → CARDIOLOGIST_QUEUE
 *  Diabetes alerts                  → ENDOCRINOLOGIST_QUEUE
 *  Oxygen/respiratory alerts        → PULMONOLOGIST_QUEUE
 */
@Service
public class NotificationRoutingService {

    // ── Cardiac alert types ──────────────────────────────────────────────
    private static final Set<String> CARDIAC_TYPES = Set.of(
            "POSSIBLE_AFIB",
            "HIGH_HEART_RATE",
            "HYPERTENSION_CRISIS"
    );

    // ── Diabetes / metabolic alert types ────────────────────────────────
    private static final Set<String> DIABETES_TYPES = Set.of(
            "DIABETES_ALERT",
            "HIGH_BLOOD_GLUCOSE",
            "HYPOGLYCEMIA_ALERT"
    );

    // ── Respiratory / oxygen alert types ────────────────────────────────
    private static final Set<String> RESPIRATORY_TYPES = Set.of(
            "OXYGEN_ALERT",
            "RESPIRATORY_ALERT",
            "HYPOXEMIA_ALERT"
    );

    public List<NotificationRoute> determineRoutes(AlertEvent event) {
        List<NotificationRoute> routes = new ArrayList<>();
        if (event == null || event.getSeverity() == null) {
            return routes;
        }

        String severity = event.getSeverity().toUpperCase();
        String alertType = event.getType() != null ? event.getType().toUpperCase() : "";

        // ── Severity-based routes ────────────────────────────────────────
        switch (severity) {
            case "CRITICAL" -> {
                routes.add(new NotificationRoute(RecipientType.DOCTOR, "DOCTOR_QUEUE", NotificationChannel.IN_APP));
                routes.add(new NotificationRoute(RecipientType.NURSE, "NURSE_QUEUE", NotificationChannel.IN_APP));
            }
            case "HIGH" -> {
                routes.add(new NotificationRoute(RecipientType.DOCTOR, "DOCTOR_QUEUE", NotificationChannel.IN_APP));
            }
            case "MEDIUM" -> {
                routes.add(new NotificationRoute(RecipientType.NURSE, "NURSE_QUEUE", NotificationChannel.IN_APP));
            }
            case "LOW" -> {
                String recipient = (event.getPatientId() != null && !event.getPatientId().isBlank())
                        ? event.getPatientId()
                        : "PATIENT_QUEUE";
                routes.add(new NotificationRoute(RecipientType.PATIENT, recipient, NotificationChannel.IN_APP));
            }
            default -> {
                routes.add(new NotificationRoute(RecipientType.NURSE, "NURSE_QUEUE", NotificationChannel.IN_APP));
            }
        }

        // ── Specialty routing (additive — on top of severity routes) ─────
        if (CARDIAC_TYPES.contains(alertType)) {
            routes.add(new NotificationRoute(
                    RecipientType.SPECIALIST, "CARDIOLOGIST_QUEUE", NotificationChannel.IN_APP));
        } else if (DIABETES_TYPES.contains(alertType)) {
            routes.add(new NotificationRoute(
                    RecipientType.SPECIALIST, "ENDOCRINOLOGIST_QUEUE", NotificationChannel.IN_APP));
        } else if (RESPIRATORY_TYPES.contains(alertType)) {
            routes.add(new NotificationRoute(
                    RecipientType.SPECIALIST, "PULMONOLOGIST_QUEUE", NotificationChannel.IN_APP));
        }

        return routes;
    }

    public String buildSubject(AlertEvent event) {
        if (event == null) {
            return "Patient Notification";
        }
        String patientId = event.getPatientId() != null ? event.getPatientId() : "Unknown";
        String severity  = event.getSeverity()  != null ? event.getSeverity()  : "Alert";
        return String.format("%s Patient Alert - %s", capitalize(severity), patientId);
    }

    public String buildMessage(AlertEvent event) {
        if (event == null) {
            return "Clinical alert notification.";
        }
        if (event.getMessage() != null && !event.getMessage().isBlank()) {
            return event.getMessage();
        }
        String alertType  = event.getType()      != null ? event.getType()      : "CLINICAL_ALERT";
        String patientId  = event.getPatientId() != null ? event.getPatientId() : "Unknown";
        return String.format("%s detected for patient %s.", alertType, patientId);
    }

    private String capitalize(String text) {
        if (text == null || text.isEmpty()) return "";
        return text.substring(0, 1).toUpperCase() + text.substring(1).toLowerCase();
    }
}
