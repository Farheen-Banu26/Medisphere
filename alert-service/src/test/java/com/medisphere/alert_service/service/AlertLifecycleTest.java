package com.medisphere.alert_service.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import com.medisphere.alert_service.client.AuditClient;
import com.medisphere.alert_service.client.FlaskClient;
import com.medisphere.alert_service.client.HealthTwinClient;
import com.medisphere.alert_service.client.PatientClient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.medisphere.alert_service.dto.VitalMessage;
import com.medisphere.alert_service.exception.AlertNotFoundException;
import com.medisphere.alert_service.exception.InvalidAcknowledgementException;
import com.medisphere.alert_service.exception.InvalidLifecycleTransitionException;
import com.medisphere.alert_service.model.Alert;
import com.medisphere.alert_service.model.AlertSeverity;
import com.medisphere.alert_service.model.AlertStatus;
import com.medisphere.alert_service.repository.AlertRepository;

class AlertLifecycleTest {

    private AlertRepository repository;
    private PatientClient patientClient;
    private HealthTwinClient healthTwinClient;
    private FlaskClient flaskClient;
    private AuditClient auditClient;
    private AlertService service;

    @BeforeEach
    void setUp() {
        repository = mock(AlertRepository.class);
        patientClient = mock(PatientClient.class);
        healthTwinClient = mock(HealthTwinClient.class);
        flaskClient = mock(FlaskClient.class);
        auditClient = mock(AuditClient.class);
        service = new AlertService(repository, null, patientClient, healthTwinClient, flaskClient, auditClient);
    }

    @Test
    void shouldTransitionNewToSent() {
        Alert alert = createSampleAlert("ALT-300", AlertStatus.NEW);
        when(repository.findByAlertId("ALT-300")).thenReturn(Optional.of(alert));
        when(repository.save(any(Alert.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Alert result = service.markSent("ALT-300");

        assertEquals(AlertStatus.SENT, result.getStatus());
        assertNotNull(result.getSentAt());
        verify(repository).save(alert);
    }

    @Test
    void shouldTransitionSentToDelivered() {
        Alert alert = createSampleAlert("ALT-301", AlertStatus.SENT);
        alert.setSentAt(LocalDateTime.now().minusMinutes(2));
        when(repository.findByAlertId("ALT-301")).thenReturn(Optional.of(alert));
        when(repository.save(any(Alert.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Alert result = service.markDelivered("ALT-301");

        assertEquals(AlertStatus.DELIVERED, result.getStatus());
        assertNotNull(result.getDeliveredAt());
        verify(repository).save(alert);
    }

    @Test
    void shouldTransitionSentToAcknowledged() {
        Alert alert = createSampleAlert("ALT-302", AlertStatus.SENT);
        alert.setSentAt(LocalDateTime.now().minusMinutes(2));
        when(repository.findByAlertId("ALT-302")).thenReturn(Optional.of(alert));
        when(repository.save(any(Alert.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Alert result = service.acknowledgeAlert("ALT-302", "doctor@example.com");

        assertEquals(AlertStatus.ACKNOWLEDGED, result.getStatus());
        assertEquals("doctor@example.com", result.getAcknowledgedBy());
        assertNotNull(result.getAcknowledgedAt());
        verify(repository).save(alert);
    }

    @Test
    void shouldTransitionDeliveredToAcknowledged() {
        Alert alert = createSampleAlert("ALT-303", AlertStatus.DELIVERED);
        alert.setDeliveredAt(LocalDateTime.now().minusMinutes(1));
        when(repository.findByAlertId("ALT-303")).thenReturn(Optional.of(alert));
        when(repository.save(any(Alert.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Alert result = service.acknowledgeAlert("ALT-303", "doctor@example.com");

        assertEquals(AlertStatus.ACKNOWLEDGED, result.getStatus());
        assertEquals("doctor@example.com", result.getAcknowledgedBy());
        assertNotNull(result.getAcknowledgedAt());
        verify(repository).save(alert);
    }

    @Test
    void shouldPreventLifecycleRegressionFromAcknowledged() {
        Alert alert = createSampleAlert("ALT-304", AlertStatus.ACKNOWLEDGED);
        alert.setAcknowledgedAt(LocalDateTime.now().minusMinutes(5));
        alert.setAcknowledgedBy("doctor@example.com");
        when(repository.findByAlertId("ALT-304")).thenReturn(Optional.of(alert));

        Alert sentResult = service.markSent("ALT-304");
        assertEquals(AlertStatus.ACKNOWLEDGED, sentResult.getStatus());

        Alert deliveredResult = service.markDelivered("ALT-304");
        assertEquals(AlertStatus.ACKNOWLEDGED, deliveredResult.getStatus());

        verify(repository, never()).save(any());
    }

    @Test
    void shouldPreventLifecycleRegressionFromClosed() {
        Alert alert = createSampleAlert("ALT-305", AlertStatus.CLOSED);
        alert.setClosedAt(LocalDateTime.now().minusMinutes(10));
        when(repository.findByAlertId("ALT-305")).thenReturn(Optional.of(alert));

        Alert sentResult = service.markSent("ALT-305");
        assertEquals(AlertStatus.CLOSED, sentResult.getStatus());

        Alert deliveredResult = service.markDelivered("ALT-305");
        assertEquals(AlertStatus.CLOSED, deliveredResult.getStatus());

        verify(repository, never()).save(any());
    }

    @Test
    void shouldBeIdempotentForRepeatedSent() {
        Alert alert = createSampleAlert("ALT-306", AlertStatus.SENT);
        LocalDateTime sentTime = LocalDateTime.now().minusMinutes(5);
        alert.setSentAt(sentTime);
        when(repository.findByAlertId("ALT-306")).thenReturn(Optional.of(alert));

        Alert result = service.markSent("ALT-306");

        assertEquals(AlertStatus.SENT, result.getStatus());
        assertEquals(sentTime, result.getSentAt());
        verify(repository, never()).save(any());
    }

    @Test
    void shouldBeIdempotentForRepeatedDelivered() {
        Alert alert = createSampleAlert("ALT-307", AlertStatus.DELIVERED);
        LocalDateTime deliveredTime = LocalDateTime.now().minusMinutes(3);
        alert.setDeliveredAt(deliveredTime);
        when(repository.findByAlertId("ALT-307")).thenReturn(Optional.of(alert));

        Alert result = service.markDelivered("ALT-307");

        assertEquals(AlertStatus.DELIVERED, result.getStatus());
        assertEquals(deliveredTime, result.getDeliveredAt());
        verify(repository, never()).save(any());
    }

    @Test
    void shouldTransitionNewToAcknowledged() {
        Alert alert = createSampleAlert("ALT-100", AlertStatus.NEW);
        when(repository.findByAlertId("ALT-100")).thenReturn(Optional.of(alert));
        when(repository.save(any(Alert.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Alert result = service.acknowledgeAlert("ALT-100", "doctor@example.com");

        assertEquals(AlertStatus.ACKNOWLEDGED, result.getStatus());
        assertEquals("doctor@example.com", result.getAcknowledgedBy());
        assertNotNull(result.getAcknowledgedAt());
        assertNull(result.getClosedAt());
        verify(repository).save(alert);
    }

    @Test
    void shouldTransitionAcknowledgedToClosed() {
        Alert alert = createSampleAlert("ALT-101", AlertStatus.ACKNOWLEDGED);
        alert.setAcknowledgedAt(LocalDateTime.now().minusMinutes(5));
        alert.setAcknowledgedBy("doctor@example.com");
        when(repository.findByAlertId("ALT-101")).thenReturn(Optional.of(alert));
        when(repository.save(any(Alert.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Alert result = service.closeAlert("ALT-101");

        assertEquals(AlertStatus.CLOSED, result.getStatus());
        assertNotNull(result.getClosedAt());
        assertNotNull(result.getAcknowledgedAt());
        assertEquals("doctor@example.com", result.getAcknowledgedBy());
        verify(repository).save(alert);
    }

    @Test
    void shouldRejectNewToClosedTransition() {
        Alert alert = createSampleAlert("ALT-102", AlertStatus.NEW);
        when(repository.findByAlertId("ALT-102")).thenReturn(Optional.of(alert));

        InvalidLifecycleTransitionException ex = assertThrows(
                InvalidLifecycleTransitionException.class,
                () -> service.closeAlert("ALT-102")
        );

        assertTrue(ex.getMessage().contains("must be ACKNOWLEDGED before it can be CLOSED"));
        verify(repository, never()).save(any());
    }

    @Test
    void shouldRejectAcknowledgingClosedAlert() {
        Alert alert = createSampleAlert("ALT-103", AlertStatus.CLOSED);
        alert.setClosedAt(LocalDateTime.now());
        when(repository.findByAlertId("ALT-103")).thenReturn(Optional.of(alert));

        InvalidLifecycleTransitionException ex = assertThrows(
                InvalidLifecycleTransitionException.class,
                () -> service.acknowledgeAlert("ALT-103", "doctor@example.com")
        );

        assertTrue(ex.getMessage().contains("Cannot acknowledge a CLOSED alert"));
        verify(repository, never()).save(any());
    }

    @Test
    void shouldBeIdempotentForRepeatedAcknowledge() {
        Alert alert = createSampleAlert("ALT-104", AlertStatus.ACKNOWLEDGED);
        LocalDateTime initialAckTime = LocalDateTime.now().minusHours(1);
        alert.setAcknowledgedAt(initialAckTime);
        alert.setAcknowledgedBy("doctor@example.com");
        when(repository.findByAlertId("ALT-104")).thenReturn(Optional.of(alert));

        Alert result = service.acknowledgeAlert("ALT-104", "another.doctor@example.com");

        assertEquals(AlertStatus.ACKNOWLEDGED, result.getStatus());
        assertEquals(initialAckTime, result.getAcknowledgedAt());
        assertEquals("doctor@example.com", result.getAcknowledgedBy());
        verify(repository, never()).save(any());
    }

    @Test
    void shouldBeIdempotentForRepeatedClose() {
        Alert alert = createSampleAlert("ALT-105", AlertStatus.CLOSED);
        LocalDateTime initialClosedTime = LocalDateTime.now().minusHours(1);
        alert.setClosedAt(initialClosedTime);
        when(repository.findByAlertId("ALT-105")).thenReturn(Optional.of(alert));

        Alert result = service.closeAlert("ALT-105");

        assertEquals(AlertStatus.CLOSED, result.getStatus());
        assertEquals(initialClosedTime, result.getClosedAt());
        verify(repository, never()).save(any());
    }

    @Test
    void shouldRejectBlankOrNullAcknowledgedBy() {
        assertThrows(InvalidAcknowledgementException.class, () -> service.acknowledgeAlert("ALT-106", null));
        assertThrows(InvalidAcknowledgementException.class, () -> service.acknowledgeAlert("ALT-106", ""));
        assertThrows(InvalidAcknowledgementException.class, () -> service.acknowledgeAlert("ALT-106", "   "));
    }

    @Test
    void shouldThrowNotFoundWhenAlertDoesNotExist() {
        when(repository.findByAlertId("ALT-999")).thenReturn(Optional.empty());

        assertThrows(AlertNotFoundException.class, () -> service.acknowledgeAlert("ALT-999", "doc@example.com"));
        assertThrows(AlertNotFoundException.class, () -> service.closeAlert("ALT-999"));
    }

    @Test
    void closedAlertNoLongerAppearsAsActive() {
        Alert newAlert = createSampleAlert("ALT-201", AlertStatus.NEW);
        Alert ackAlert = createSampleAlert("ALT-202", AlertStatus.ACKNOWLEDGED);

        when(repository.findByStatusNotOrderByCreatedAtDesc(AlertStatus.CLOSED))
                .thenReturn(List.of(newAlert, ackAlert));

        List<Alert> activeAlerts = service.findActiveAlerts();

        assertEquals(2, activeAlerts.size());
        assertFalse(activeAlerts.stream().anyMatch(a -> a.getStatus() == AlertStatus.CLOSED));
    }

    @Test
    void closedAlertPermitsFutureAlertOfSameType() {
        List<Alert> dbAlerts = new ArrayList<>();

        when(repository.findByPatientIdAndTypeAndStatusNot(eq("P001"), eq("HIGH_HEART_RATE"), eq(AlertStatus.CLOSED)))
                .thenAnswer(inv -> dbAlerts.stream()
                        .filter(a -> a.getPatientId().equals("P001") && a.getType().equals("HIGH_HEART_RATE") && a.getStatus() != AlertStatus.CLOSED)
                        .toList());

        when(repository.save(any(Alert.class))).thenAnswer(inv -> {
            Alert saved = inv.getArgument(0);
            dbAlerts.removeIf(a -> a.getAlertId() != null && a.getAlertId().equals(saved.getAlertId()));
            dbAlerts.add(saved);
            return saved;
        });

        VitalMessage message = new VitalMessage();
        message.setPatientId("P001");
        message.setHeartRate(140);
        message.setSpo2(98);

        // 1st processing creates NEW alert
        service.processVitals(message);
        assertEquals(1, dbAlerts.size());
        Alert firstAlert = dbAlerts.get(0);
        assertEquals(AlertStatus.NEW, firstAlert.getStatus());

        // 2nd processing when NEW -> duplicate skipped
        service.processVitals(message);
        assertEquals(1, dbAlerts.size());

        // Acknowledge -> still active
        firstAlert.setStatus(AlertStatus.ACKNOWLEDGED);
        service.processVitals(message);
        assertEquals(1, dbAlerts.size());

        // Close -> status CLOSED
        firstAlert.setStatus(AlertStatus.CLOSED);

        // 3rd processing -> allowed! New alert generated
        service.processVitals(message);
        assertEquals(2, dbAlerts.size());
    }

    private Alert createSampleAlert(String alertId, AlertStatus status) {
        Alert alert = new Alert();
        alert.setAlertId(alertId);
        alert.setPatientId("P001");
        alert.setType("HIGH_HEART_RATE");
        alert.setSeverity(AlertSeverity.HIGH);
        alert.setMessage("Heart rate elevated");
        alert.setSource("CLINICAL_RULE_ENGINE");
        alert.setStatus(status);
        alert.setCreatedAt(LocalDateTime.now().minusHours(2));
        return alert;
    }
}
