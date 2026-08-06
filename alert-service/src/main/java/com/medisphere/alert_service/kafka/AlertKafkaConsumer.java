package com.medisphere.alert_service.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.medisphere.alert_service.dto.VitalMessage;
import com.medisphere.alert_service.service.AlertService;

@Component
public class AlertKafkaConsumer {

    private static final Logger logger = LoggerFactory.getLogger(AlertKafkaConsumer.class);

    private final AlertService alertService;

    public AlertKafkaConsumer(AlertService alertService) {
        this.alertService = alertService;
    }

    @KafkaListener(topics = "vitals-topic", groupId = "alert-service-group")
    public void consume(VitalMessage message) {
        if (message == null) {
            return;
        }
        logger.info("Received vitals message for patient {}", message.getPatientId());
        alertService.processVitals(message);
    }
}
