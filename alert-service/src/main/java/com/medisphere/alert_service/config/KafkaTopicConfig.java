package com.medisphere.alert_service.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

import com.medisphere.alert_service.kafka.AlertKafkaProducer;

@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic alertsStreamTopic() {
        return TopicBuilder.name(AlertKafkaProducer.TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }
}
