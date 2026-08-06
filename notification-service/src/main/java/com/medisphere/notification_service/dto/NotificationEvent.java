package com.medisphere.notification_service.dto;

import java.time.LocalDateTime;

import com.medisphere.notification_service.model.Notification;
import com.medisphere.notification_service.model.NotificationChannel;
import com.medisphere.notification_service.model.NotificationStatus;
import com.medisphere.notification_service.model.RecipientType;

public class NotificationEvent {

    private String notificationId;
    private String alertId;
    private String patientId;

    private String alertType;
    private String severity;

    private RecipientType recipientType;
    private String recipient;
    private NotificationChannel channel;

    private String subject;
    private String message;
    private NotificationStatus status;

    private LocalDateTime createdAt;

    public NotificationEvent() {
    }

    public static NotificationEvent fromNotification(Notification notification) {
        NotificationEvent event = new NotificationEvent();
        event.setNotificationId(notification.getNotificationId());
        event.setAlertId(notification.getAlertId());
        event.setPatientId(notification.getPatientId());
        event.setAlertType(notification.getAlertType());
        event.setSeverity(notification.getSeverity());
        event.setRecipientType(notification.getRecipientType());
        event.setRecipient(notification.getRecipient());
        event.setChannel(notification.getChannel());
        event.setSubject(notification.getSubject());
        event.setMessage(notification.getMessage());
        event.setStatus(notification.getStatus());
        event.setCreatedAt(notification.getCreatedAt());
        return event;
    }

    public String getNotificationId() {
        return notificationId;
    }

    public void setNotificationId(String notificationId) {
        this.notificationId = notificationId;
    }

    public String getAlertId() {
        return alertId;
    }

    public void setAlertId(String alertId) {
        this.alertId = alertId;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getAlertType() {
        return alertType;
    }

    public void setAlertType(String alertType) {
        this.alertType = alertType;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public RecipientType getRecipientType() {
        return recipientType;
    }

    public void setRecipientType(RecipientType recipientType) {
        this.recipientType = recipientType;
    }

    public String getRecipient() {
        return recipient;
    }

    public void setRecipient(String recipient) {
        this.recipient = recipient;
    }

    public NotificationChannel getChannel() {
        return channel;
    }

    public void setChannel(NotificationChannel channel) {
        this.channel = channel;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public NotificationStatus getStatus() {
        return status;
    }

    public void setStatus(NotificationStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
