package com.medisphere.notification_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.medisphere.notification_service.model.Notification;
import com.medisphere.notification_service.model.NotificationChannel;
import com.medisphere.notification_service.model.NotificationStatus;
import com.medisphere.notification_service.model.RecipientType;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {

    boolean existsByAlertIdAndRecipientTypeAndChannel(String alertId, RecipientType recipientType, NotificationChannel channel);

    List<Notification> findByPatientIdOrderByCreatedAtDesc(String patientId);

    List<Notification> findByStatusOrderByCreatedAtDesc(NotificationStatus status);

    List<Notification> findByRecipientTypeOrderByCreatedAtDesc(RecipientType recipientType);

    List<Notification> findByAlertIdOrderByCreatedAtDesc(String alertId);

    Optional<Notification> findByNotificationId(String notificationId);
}
