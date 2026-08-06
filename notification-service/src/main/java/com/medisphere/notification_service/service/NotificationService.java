package com.medisphere.notification_service.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.medisphere.notification_service.dto.AlertEvent;
import com.medisphere.notification_service.dto.NotificationEvent;
import com.medisphere.notification_service.dto.NotificationRoute;
import com.medisphere.notification_service.exception.InvalidLifecycleTransitionException;
import com.medisphere.notification_service.exception.NotificationNotFoundException;
import com.medisphere.notification_service.kafka.NotificationKafkaProducer;
import com.medisphere.notification_service.model.Notification;
import com.medisphere.notification_service.model.NotificationStatus;
import com.medisphere.notification_service.repository.NotificationRepository;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository repository;
    private final NotificationRoutingService routingService;
    private final NotificationKafkaProducer kafkaProducer;
    private final AlertServiceClient alertServiceClient;
    private final EmailService emailService;

    public NotificationService(
            NotificationRepository repository,
            NotificationRoutingService routingService,
            NotificationKafkaProducer kafkaProducer) {
        this(repository, routingService, kafkaProducer, null, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public NotificationService(
            NotificationRepository repository,
            NotificationRoutingService routingService,
            NotificationKafkaProducer kafkaProducer,
            AlertServiceClient alertServiceClient,
            EmailService emailService) {
        this.repository = repository;
        this.routingService = routingService;
        this.kafkaProducer = kafkaProducer;
        this.alertServiceClient = alertServiceClient;
        this.emailService = emailService;
    }

    public void processAlert(AlertEvent event) {
        if (event == null || event.getAlertId() == null || event.getAlertId().isBlank()) {
            return;
        }

        logger.info("Processing alert event {}", event.getAlertId());

        List<NotificationRoute> routes = routingService.determineRoutes(event);
        for (NotificationRoute route : routes) {
            if (repository.existsByAlertIdAndRecipientTypeAndChannel(
                    event.getAlertId(),
                    route.getRecipientType(),
                    route.getChannel())) {
                logger.info(
                        "Duplicate notification for alert {} ({}, {}) - skipping",
                        event.getAlertId(),
                        route.getRecipientType(),
                        route.getChannel()
                );
                continue;
            }

            Notification notification = new Notification();
            notification.setNotificationId("NTF-" + UUID.randomUUID().toString().toUpperCase());
            notification.setAlertId(event.getAlertId());
            notification.setPatientId(event.getPatientId());
            notification.setAlertType(event.getType());
            notification.setSeverity(event.getSeverity());
            notification.setChannel(route.getChannel());
            notification.setRecipientType(route.getRecipientType());
            notification.setRecipient(route.getRecipient());
            notification.setSubject(routingService.buildSubject(event));
            notification.setMessage(routingService.buildMessage(event));
            notification.setStatus(NotificationStatus.PENDING);
            notification.setCreatedAt(LocalDateTime.now());

            repository.save(notification);
            logger.info("Notification created: {}", notification.getNotificationId());

            if (emailService != null) {
                emailService.sendAlertEmail(notification, event);
                repository.save(notification); // save email statuses
            }

            boolean published = false;
            if (kafkaProducer != null) {
                NotificationEvent notificationEvent = NotificationEvent.fromNotification(notification);
                published = kafkaProducer.sendNotificationEvent(notificationEvent);
            }

            if (published) {
                notification.setStatus(NotificationStatus.SENT);
                notification.setSentAt(LocalDateTime.now());
                repository.save(notification);
                logger.info("Notification {} marked as SENT", notification.getNotificationId());

                if (alertServiceClient != null) {
                    alertServiceClient.markAlertSent(notification.getAlertId());
                }
            } else {
                notification.setStatus(NotificationStatus.FAILED);
                repository.save(notification);
                logger.warn("Notification {} publication failed; marked as FAILED", notification.getNotificationId());
            }
        }
    }

    public Notification markDelivered(String notificationId) {
        Notification notification = repository.findByNotificationId(notificationId)
                .orElseThrow(() -> new NotificationNotFoundException("Notification not found with id: " + notificationId));

        if (notification.getStatus() == NotificationStatus.DELIVERED) {
            return notification;
        }

        if (notification.getStatus() != NotificationStatus.SENT) {
            throw new InvalidLifecycleTransitionException(
                    "Cannot transition notification " + notificationId + " from status " + notification.getStatus() + " to DELIVERED"
            );
        }

        notification.setStatus(NotificationStatus.DELIVERED);
        notification.setDeliveredAt(LocalDateTime.now());
        Notification saved = repository.save(notification);
        logger.info("Notification {} marked as DELIVERED", notificationId);

        if (alertServiceClient != null) {
            alertServiceClient.markAlertDelivered(saved.getAlertId());
        }

        return saved;
    }

    public List<Notification> findAll() {
        return repository.findAll();
    }

    public List<Notification> findByPatientId(String patientId) {
        return repository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    public List<Notification> findByAlertId(String alertId) {
        return repository.findByAlertIdOrderByCreatedAtDesc(alertId);
    }

    public List<Notification> findPending() {
        return repository.findByStatusOrderByCreatedAtDesc(NotificationStatus.PENDING);
    }

    public Notification findByNotificationId(String notificationId) {
        return repository.findByNotificationId(notificationId).orElse(null);
    }
}
