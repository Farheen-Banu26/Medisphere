package com.medisphere.notification_service.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import com.medisphere.notification_service.dto.NotificationEvent;

@Component
public class NotificationKafkaProducer {

    private static final Logger logger = LoggerFactory.getLogger(NotificationKafkaProducer.class);
    public static final String TOPIC = "notification-stream";

    private final KafkaTemplate<String, NotificationEvent> kafkaTemplate;

    public NotificationKafkaProducer(KafkaTemplate<String, NotificationEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public boolean sendNotificationEvent(NotificationEvent event) {
        if (event == null || event.getNotificationId() == null) {
            return false;
        }
        try {
            var future = kafkaTemplate.send(TOPIC, event.getNotificationId(), event);
            if (future != null) {
                future.get();
            }
            logger.info("Published notification {} to notification-stream", event.getNotificationId());
            return true;
        } catch (Exception e) {
            logger.error("Failed to publish notification {} to notification-stream: {}", event.getNotificationId(), e.getMessage(), e);
            return false;
        }
    }
}
