package com.medisphere.notification_service.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.medisphere.notification_service.dto.AlertEvent;
import com.medisphere.notification_service.dto.NotificationRoute;
import com.medisphere.notification_service.model.NotificationChannel;
import com.medisphere.notification_service.model.RecipientType;

@Service
public class NotificationRoutingService {

    public List<NotificationRoute> determineRoutes(AlertEvent event) {
        List<NotificationRoute> routes = new ArrayList<>();
        if (event == null || event.getSeverity() == null) {
            return routes;
        }

        String severity = event.getSeverity().toUpperCase();

        switch (severity) {
            case "CRITICAL":
                routes.add(new NotificationRoute(RecipientType.DOCTOR, "DOCTOR_QUEUE", NotificationChannel.IN_APP));
                routes.add(new NotificationRoute(RecipientType.NURSE, "NURSE_QUEUE", NotificationChannel.IN_APP));
                break;
            case "HIGH":
                routes.add(new NotificationRoute(RecipientType.DOCTOR, "DOCTOR_QUEUE", NotificationChannel.IN_APP));
                break;
            case "MEDIUM":
                routes.add(new NotificationRoute(RecipientType.NURSE, "NURSE_QUEUE", NotificationChannel.IN_APP));
                break;
            case "LOW":
                String recipient = (event.getPatientId() != null && !event.getPatientId().isBlank())
                        ? event.getPatientId()
                        : "PATIENT_QUEUE";
                routes.add(new NotificationRoute(RecipientType.PATIENT, recipient, NotificationChannel.IN_APP));
                break;
            default:
                // Fallback default route for unrecognized severity
                routes.add(new NotificationRoute(RecipientType.NURSE, "NURSE_QUEUE", NotificationChannel.IN_APP));
                break;
        }

        return routes;
    }

    public String buildSubject(AlertEvent event) {
        if (event == null) {
            return "Patient Notification";
        }
        String patientId = event.getPatientId() != null ? event.getPatientId() : "Unknown";
        String severity = event.getSeverity() != null ? event.getSeverity() : "Alert";
        return String.format("%s Patient Alert - %s", capitalize(severity), patientId);
    }

    public String buildMessage(AlertEvent event) {
        if (event == null) {
            return "Clinical alert notification.";
        }
        if (event.getMessage() != null && !event.getMessage().isBlank()) {
            return event.getMessage();
        }
        String alertType = event.getType() != null ? event.getType() : "CLINICAL_ALERT";
        String patientId = event.getPatientId() != null ? event.getPatientId() : "Unknown";
        return String.format("%s detected for patient %s.", alertType, patientId);
    }

    private String capitalize(String text) {
        if (text == null || text.isEmpty()) {
            return "";
        }
        return text.substring(0, 1).toUpperCase() + text.substring(1).toLowerCase();
    }
}
