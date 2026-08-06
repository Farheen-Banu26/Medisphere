package com.medisphere.alert_service.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import com.medisphere.alert_service.dto.AlertEvent;

@Component
public class AlertKafkaProducer {

    private static final Logger logger = LoggerFactory.getLogger(AlertKafkaProducer.class);
    public static final String TOPIC = "alerts-stream";

    private final KafkaTemplate<String, AlertEvent> kafkaTemplate;

    public AlertKafkaProducer(KafkaTemplate<String, AlertEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendAlertEvent(AlertEvent event) {
        if (event == null || event.getAlertId() == null) {
            return;
        }
        try {
            kafkaTemplate.send(TOPIC, event.getAlertId(), event);
            logger.info("Published alert {} to alerts-stream", event.getAlertId());
        } catch (Exception e) {
            logger.error("Failed to publish alert {} to alerts-stream: {}", event.getAlertId(), e.getMessage(), e);
        }
    }
}
