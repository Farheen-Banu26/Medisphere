package com.medisphere.notification_service.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

import com.medisphere.notification_service.kafka.NotificationKafkaProducer;

@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic notificationStreamTopic() {
        return TopicBuilder.name(NotificationKafkaProducer.TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }
}
