package com.infosys.vitals_service.kafka;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.infosys.vitals_service.dto.VitalMessage;

@Service
public class KafkaProducer {

    private static final String TOPIC = "vitals-topic";

    @Autowired
    private KafkaTemplate<String, VitalMessage> kafkaTemplate;

    public void sendMessage(VitalMessage message) {

        kafkaTemplate.send(TOPIC, message);

        System.out.println("KafkaProducer: sent message for patient=" + message.getPatientId() + " temperature=" + message.getTemperature());
    }
}