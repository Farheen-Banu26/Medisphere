package com.medisphere.notification_service.dto;

import com.medisphere.notification_service.model.NotificationChannel;
import com.medisphere.notification_service.model.RecipientType;

public class NotificationRoute {

    private RecipientType recipientType;
    private String recipient;
    private NotificationChannel channel;

    public NotificationRoute() {
    }

    public NotificationRoute(RecipientType recipientType, String recipient, NotificationChannel channel) {
        this.recipientType = recipientType;
        this.recipient = recipient;
        this.channel = channel;
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
}
