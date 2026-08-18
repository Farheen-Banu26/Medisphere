package com.medisphere.notification_service.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.medisphere.notification_service.dto.NotificationEvent;
import com.medisphere.notification_service.sse.SseEmitterRegistry;

/**
 * Consumes events from the notification-stream topic and broadcasts them
 * in real-time to connected browser clients via Server-Sent Events (SSE).
 *
 * This is the final leg of the Kafka pipeline:
 *   alerts-stream → notification-service → notification-stream → SSE → browser
 */
@Component
public class NotificationStreamConsumer {

    private static final Logger logger = LoggerFactory.getLogger(NotificationStreamConsumer.class);

    private final SseEmitterRegistry sseEmitterRegistry;

    public NotificationStreamConsumer(SseEmitterRegistry sseEmitterRegistry) {
        this.sseEmitterRegistry = sseEmitterRegistry;
    }

    @KafkaListener(
        topics = "notification-stream",
        groupId = "notification-sse-group",
        containerFactory = "notificationEventContainerFactory"
    )
    public void consume(NotificationEvent event) {
        if (event == null || event.getNotificationId() == null) {
            return;
        }
        logger.info("notification-stream consumed: {} for patient {} (severity: {})",
                event.getNotificationId(), event.getPatientId(), event.getSeverity());
        sseEmitterRegistry.broadcast(event);
    }
}
