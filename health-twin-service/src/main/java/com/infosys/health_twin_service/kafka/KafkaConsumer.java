package com.infosys.health_twin_service.kafka;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.infosys.health_twin_service.dto.VitalMessage;
import com.infosys.health_twin_service.service.HealthTwinService;

@Component
public class KafkaConsumer {

    @Autowired
    private HealthTwinService healthTwinService;

    @KafkaListener(
            topics = "vitals-topic",
            groupId = "health-twin-group")
    public void consume(VitalMessage message) {
        if (message == null || message.getPatientId() == null || message.getPatientId().isBlank()) {
            return;
        }

        System.out.println("=================================");
        System.out.println("KafkaConsumer: received message from Kafka");
        System.out.println("Patient ID : " + message.getPatientId());
        System.out.println("Heart Rate : " + message.getHeartRate());
        System.out.println("BP         : " + message.getBpSystolic() + "/" + message.getBpDiastolic());
        System.out.println("Temperature: " + message.getTemperature());
        System.out.println("SpO2       : " + message.getSpo2());
        System.out.println("Steps      : " + message.getSteps());
        System.out.println("Sleep Hours: " + message.getSleepHours());
        System.out.println("=================================");

        healthTwinService.updateVitals(message);
    }
}