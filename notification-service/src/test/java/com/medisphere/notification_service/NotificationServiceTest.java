package com.medisphere.notification_service;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.medisphere.notification_service.dto.AlertEvent;
import com.medisphere.notification_service.exception.InvalidLifecycleTransitionException;
import com.medisphere.notification_service.kafka.NotificationKafkaProducer;
import com.medisphere.notification_service.model.Notification;
import com.medisphere.notification_service.model.NotificationChannel;
import com.medisphere.notification_service.model.NotificationStatus;
import com.medisphere.notification_service.model.RecipientType;
import com.medisphere.notification_service.repository.NotificationRepository;
import com.medisphere.notification_service.service.AlertServiceClient;
import com.medisphere.notification_service.service.AuditClient;
import com.medisphere.notification_service.service.EmailService;
import com.medisphere.notification_service.service.NotificationRoutingService;
import com.medisphere.notification_service.service.NotificationService;

class NotificationServiceTest {

    private NotificationRepository repository;
    private NotificationRoutingService routingService;
    private NotificationKafkaProducer kafkaProducer;
    private AlertServiceClient alertServiceClient;
    private EmailService emailService;
    private AuditClient auditClient;
    private NotificationService service;

    @BeforeEach
    void setUp() {
        repository = mock(NotificationRepository.class);
        routingService = new NotificationRoutingService();
        kafkaProducer = mock(NotificationKafkaProducer.class);
        alertServiceClient = mock(AlertServiceClient.class);
        emailService = mock(EmailService.class);
        auditClient = mock(AuditClient.class);
        service = new NotificationService(repository, routingService, kafkaProducer, alertServiceClient, emailService, auditClient);
    }

    @Test
    void criticalAlertCreatesDoctorAndNurseNotifications() {
        AlertEvent event = createSampleAlertEvent("ALT-1", "CRITICAL", "P001", "CRITICAL_ALERT");

        when(repository.existsByAlertIdAndRecipientTypeAndChannel(any(), any(), any())).thenReturn(false);
        when(repository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));
        when(kafkaProducer.sendNotificationEvent(any())).thenReturn(true);

        service.processAlert(event);

        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(repository, times(4)).save(notifCaptor.capture()); // 2 PENDING saves + 2 SENT saves

        var savedNotifications = notifCaptor.getAllValues();
        assertEquals(4, savedNotifications.size());
        assertTrue(savedNotifications.stream().anyMatch(n -> n.getRecipientType() == RecipientType.DOCTOR && n.getStatus() == NotificationStatus.SENT));
        assertTrue(savedNotifications.stream().anyMatch(n -> n.getRecipientType() == RecipientType.NURSE && n.getStatus() == NotificationStatus.SENT));

        verify(kafkaProducer, times(2)).sendNotificationEvent(any());
        verify(alertServiceClient, times(2)).markAlertSent("ALT-1");
    }

    @Test
    void highAlertCreatesDoctorNotificationOnly() {
        AlertEvent event = createSampleAlertEvent("ALT-2", "HIGH", "P001", "GENERAL_HIGH_ALERT");

        when(repository.existsByAlertIdAndRecipientTypeAndChannel(any(), any(), any())).thenReturn(false);
        when(repository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));
        when(kafkaProducer.sendNotificationEvent(any())).thenReturn(true);

        service.processAlert(event);

        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(repository, times(2)).save(notifCaptor.capture());

        Notification finalSaved = notifCaptor.getValue();
        assertEquals(RecipientType.DOCTOR, finalSaved.getRecipientType());
        assertEquals("DOCTOR_QUEUE", finalSaved.getRecipient());
        assertEquals(NotificationChannel.IN_APP, finalSaved.getChannel());
        assertEquals(NotificationStatus.SENT, finalSaved.getStatus());
        assertNotNull(finalSaved.getSentAt());

        verify(kafkaProducer, times(1)).sendNotificationEvent(any());
        verify(alertServiceClient, times(1)).markAlertSent("ALT-2");
    }

    @Test
    void mediumAlertCreatesNurseNotificationOnly() {
        AlertEvent event = createSampleAlertEvent("ALT-3", "MEDIUM", "P001", "TEMPERATURE_ALERT");

        when(repository.existsByAlertIdAndRecipientTypeAndChannel(any(), any(), any())).thenReturn(false);
        when(repository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));
        when(kafkaProducer.sendNotificationEvent(any())).thenReturn(true);

        service.processAlert(event);

        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(repository, times(2)).save(notifCaptor.capture());

        Notification finalSaved = notifCaptor.getValue();
        assertEquals(RecipientType.NURSE, finalSaved.getRecipientType());
        assertEquals("NURSE_QUEUE", finalSaved.getRecipient());
        assertEquals(NotificationStatus.SENT, finalSaved.getStatus());

        verify(kafkaProducer, times(1)).sendNotificationEvent(any());
    }

    @Test
    void lowAlertCreatesPatientNotificationOnly() {
        AlertEvent event = createSampleAlertEvent("ALT-4", "LOW", "P001", "VITALS_CHECK");

        when(repository.existsByAlertIdAndRecipientTypeAndChannel(any(), any(), any())).thenReturn(false);
        when(repository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));
        when(kafkaProducer.sendNotificationEvent(any())).thenReturn(true);

        service.processAlert(event);

        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(repository, times(2)).save(notifCaptor.capture());

        Notification finalSaved = notifCaptor.getValue();
        assertEquals(RecipientType.PATIENT, finalSaved.getRecipientType());
        assertEquals("P001", finalSaved.getRecipient());
        assertEquals(NotificationStatus.SENT, finalSaved.getStatus());

        verify(kafkaProducer, times(1)).sendNotificationEvent(any());
    }

    @Test
    void duplicateAlertEventDoesNotCreateDuplicateNotificationOrPublishEvent() {
        AlertEvent event = createSampleAlertEvent("ALT-123", "HIGH", "P001", "HIGH_HEART_RATE");

        when(repository.existsByAlertIdAndRecipientTypeAndChannel(any(), any(), any()))
                .thenReturn(true);

        service.processAlert(event);

        verify(repository, never()).save(any());
        verify(kafkaProducer, never()).sendNotificationEvent(any());
    }

    @Test
    void kafkaPublishingFailurePreservesSavedMongoNotification() {
        @SuppressWarnings("unchecked")
        org.springframework.kafka.core.KafkaTemplate<String, com.medisphere.notification_service.dto.NotificationEvent> kafkaTemplate = mock(org.springframework.kafka.core.KafkaTemplate.class);
        when(kafkaTemplate.send(any(), any(), any())).thenThrow(new RuntimeException("Kafka unreachable"));

        NotificationKafkaProducer realProducer = new NotificationKafkaProducer(kafkaTemplate);
        NotificationService serviceWithRealProducer = new NotificationService(repository, routingService, realProducer, alertServiceClient, emailService, auditClient);

        AlertEvent event = createSampleAlertEvent("ALT-5", "HIGH", "P001", "GENERAL_HIGH_ALERT");

        when(repository.existsByAlertIdAndRecipientTypeAndChannel(any(), any(), any())).thenReturn(false);
        when(repository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        // processAlert must not throw or crash when Kafka send fails
        serviceWithRealProducer.processAlert(event);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(repository, times(2)).save(captor.capture()); // 1st save PENDING, 2nd save FAILED

        Notification finalSaved = captor.getValue();
        assertEquals(NotificationStatus.FAILED, finalSaved.getStatus());
        verify(alertServiceClient, never()).markAlertSent(any());
    }

    @Test
    void sentToDeliveredSucceedsAndPopulatesDeliveredAt() {
        Notification notification = createSampleNotification("NTF-100", NotificationStatus.SENT);
        notification.setSentAt(LocalDateTime.now().minusMinutes(5));
        when(repository.findByNotificationId("NTF-100")).thenReturn(Optional.of(notification));
        when(repository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        Notification result = service.markDelivered("NTF-100");

        assertEquals(NotificationStatus.DELIVERED, result.getStatus());
        assertNotNull(result.getDeliveredAt());
        verify(repository).save(notification);
        verify(alertServiceClient).markAlertDelivered("ALT-100");
    }

    @Test
    void repeatedDeliveredCallIsIdempotent() {
        Notification notification = createSampleNotification("NTF-101", NotificationStatus.DELIVERED);
        LocalDateTime initialDeliveredAt = LocalDateTime.now().minusMinutes(10);
        notification.setDeliveredAt(initialDeliveredAt);
        when(repository.findByNotificationId("NTF-101")).thenReturn(Optional.of(notification));

        Notification result = service.markDelivered("NTF-101");

        assertEquals(NotificationStatus.DELIVERED, result.getStatus());
        assertEquals(initialDeliveredAt, result.getDeliveredAt());
        verify(repository, never()).save(any());
        verify(alertServiceClient, never()).markAlertDelivered(any());
    }

    @Test
    void invalidLifecycleTransitionIsRejected() {
        Notification pendingNotif = createSampleNotification("NTF-102", NotificationStatus.PENDING);
        when(repository.findByNotificationId("NTF-102")).thenReturn(Optional.of(pendingNotif));

        assertThrows(InvalidLifecycleTransitionException.class, () -> service.markDelivered("NTF-102"));

        Notification failedNotif = createSampleNotification("NTF-103", NotificationStatus.FAILED);
        when(repository.findByNotificationId("NTF-103")).thenReturn(Optional.of(failedNotif));

        assertThrows(InvalidLifecycleTransitionException.class, () -> service.markDelivered("NTF-103"));
    }

    @Test
    void alertServiceHttpFailureDoesNotDeleteOrCorruptNotification() {
        org.springframework.web.client.RestTemplate restTemplate = mock(org.springframework.web.client.RestTemplate.class);
        doThrow(new RuntimeException("Alert service down")).when(restTemplate).put(any(String.class), any());

        AlertServiceClient realClient = new AlertServiceClient(restTemplate, "http://localhost:9002");
        NotificationService serviceWithRealClient = new NotificationService(repository, routingService, kafkaProducer, realClient, emailService, auditClient);

        Notification notification = createSampleNotification("NTF-104", NotificationStatus.SENT);
        when(repository.findByNotificationId("NTF-104")).thenReturn(Optional.of(notification));
        when(repository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        // Should complete without throwing exception
        Notification result = serviceWithRealClient.markDelivered("NTF-104");

        assertEquals(NotificationStatus.DELIVERED, result.getStatus());
        assertNotNull(result.getDeliveredAt());
        verify(repository).save(notification);
    }

    private Notification createSampleNotification(String notificationId, NotificationStatus status) {
        Notification n = new Notification();
        n.setNotificationId(notificationId);
        n.setAlertId("ALT-100");
        n.setPatientId("P001");
        n.setStatus(status);
        n.setCreatedAt(LocalDateTime.now().minusHours(1));
        return n;
    }

    private AlertEvent createSampleAlertEvent(String alertId, String severity, String patientId, String type) {
        AlertEvent event = new AlertEvent();
        event.setAlertId(alertId);
        event.setSeverity(severity);
        event.setPatientId(patientId);
        event.setType(type);
        event.setMessage("Test clinical message for " + type);
        event.setSource("CLINICAL_RULE_ENGINE");
        event.setStatus("NEW");
        event.setCreatedAt(LocalDateTime.now());
        return event;
    }
}
