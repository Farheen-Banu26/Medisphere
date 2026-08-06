package com.medisphere.notification_service.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medisphere.notification_service.model.Notification;
import com.medisphere.notification_service.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<Notification> getAllNotifications() {
        return notificationService.findAll();
    }

    @GetMapping("/patient/{patientId}")
    public List<Notification> getPatientNotifications(@PathVariable String patientId) {
        return notificationService.findByPatientId(patientId);
    }

    @GetMapping("/alert/{alertId}")
    public List<Notification> getAlertNotifications(@PathVariable String alertId) {
        return notificationService.findByAlertId(alertId);
    }

    @GetMapping("/pending")
    public List<Notification> getPendingNotifications() {
        return notificationService.findPending();
    }

    @GetMapping("/{notificationId}")
    public ResponseEntity<Notification> getNotificationById(@PathVariable String notificationId) {
        Notification notification = notificationService.findByNotificationId(notificationId);
        if (notification == null) {
            throw new com.medisphere.notification_service.exception.NotificationNotFoundException("Notification not found with id: " + notificationId);
        }
        return ResponseEntity.ok(notification);
    }

    @org.springframework.web.bind.annotation.PutMapping("/{notificationId}/delivered")
    public ResponseEntity<Notification> markDelivered(@PathVariable String notificationId) {
        Notification updated = notificationService.markDelivered(notificationId);
        return ResponseEntity.ok(updated);
    }
}
