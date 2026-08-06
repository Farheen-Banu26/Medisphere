package com.medisphere.notification_service.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.medisphere.notification_service.dto.AlertEvent;
import com.medisphere.notification_service.service.NotificationService;

@Component
public class AlertKafkaConsumer {

    private static final Logger logger = LoggerFactory.getLogger(AlertKafkaConsumer.class);

    private final NotificationService notificationService;

    public AlertKafkaConsumer(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = "alerts-stream", groupId = "notification-service-group")
    public void consume(AlertEvent event) {
        if (event == null) {
            return;
        }
        logger.info("Received alert event {} for patient {}", event.getAlertId(), event.getPatientId());
        notificationService.processAlert(event);
    }
}
