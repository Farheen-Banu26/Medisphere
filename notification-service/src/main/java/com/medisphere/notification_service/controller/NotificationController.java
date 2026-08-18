package com.medisphere.notification_service.controller;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.medisphere.notification_service.model.Notification;
import com.medisphere.notification_service.service.NotificationService;
import com.medisphere.notification_service.sse.SseEmitterRegistry;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final SseEmitterRegistry sseEmitterRegistry;

    public NotificationController(NotificationService notificationService,
                                  SseEmitterRegistry sseEmitterRegistry) {
        this.notificationService = notificationService;
        this.sseEmitterRegistry = sseEmitterRegistry;
    }

    @GetMapping
    public List<Notification> getAllNotifications() {
        return notificationService.findAll();
    }

    @GetMapping("/patient/{patientId}")
    public List<Notification> getPatientNotifications(@PathVariable String patientId, jakarta.servlet.http.HttpServletRequest request) {
        notificationService.verifyPatientResourceAccess(patientId, request);
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
    public ResponseEntity<Notification> getNotificationById(@PathVariable String notificationId, jakarta.servlet.http.HttpServletRequest request) {
        Notification notification = notificationService.findByNotificationId(notificationId);
        if (notification == null) {
            throw new com.medisphere.notification_service.exception.NotificationNotFoundException("Notification not found with id: " + notificationId);
        }
        if (notification.getPatientId() != null) {
            notificationService.verifyPatientResourceAccess(notification.getPatientId(), request);
        }
        return ResponseEntity.ok(notification);
    }

    @org.springframework.web.bind.annotation.PutMapping("/{notificationId}/delivered")
    public ResponseEntity<Notification> markDelivered(@PathVariable String notificationId) {
        Notification updated = notificationService.markDelivered(notificationId);
        return ResponseEntity.ok(updated);
    }

    /**
     * SSE endpoint — browser clients subscribe here to receive real-time notifications
     * pushed from the notification-stream Kafka topic.
     *
     * GET /api/notifications/stream
     */
    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications() {
        return sseEmitterRegistry.createEmitter();
    }
}
