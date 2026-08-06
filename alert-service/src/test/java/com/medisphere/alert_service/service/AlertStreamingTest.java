package com.medisphere.alert_service.service;

import java.util.Collections;
import java.util.List;

import com.medisphere.alert_service.client.FlaskClient;
import com.medisphere.alert_service.client.HealthTwinClient;
import com.medisphere.alert_service.client.PatientClient;

import static org.junit.jupiter.api.Assertions.assertEquals;
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

import com.medisphere.alert_service.dto.AlertEvent;
import com.medisphere.alert_service.dto.VitalMessage;
import com.medisphere.alert_service.kafka.AlertKafkaProducer;
import com.medisphere.alert_service.model.Alert;
import com.medisphere.alert_service.model.AlertStatus;
import com.medisphere.alert_service.repository.AlertRepository;

class AlertStreamingTest {

    private AlertRepository repository;
    private AlertKafkaProducer kafkaProducer;
    private PatientClient patientClient;
    private HealthTwinClient healthTwinClient;
    private FlaskClient flaskClient;
    private AlertService service;

    @BeforeEach
    void setUp() {
        repository = mock(AlertRepository.class);
        kafkaProducer = mock(AlertKafkaProducer.class);
        patientClient = mock(PatientClient.class);
        healthTwinClient = mock(HealthTwinClient.class);
        flaskClient = mock(FlaskClient.class);
        service = new AlertService(repository, kafkaProducer, patientClient, healthTwinClient, flaskClient);
    }

    @Test
    void shouldSaveAndPublishNewlyCreatedAlert() {
        when(repository.findByPatientIdAndTypeAndStatusNot(eq("P001"), eq("HIGH_HEART_RATE"), eq(AlertStatus.CLOSED)))
                .thenReturn(Collections.emptyList());
        when(repository.save(any(Alert.class))).thenAnswer(inv -> inv.getArgument(0));

        VitalMessage message = new VitalMessage();
        message.setPatientId("P001");
        message.setHeartRate(140);
        message.setSpo2(98);

        service.processVitals(message);

        verify(repository, times(1)).save(any(Alert.class));

        ArgumentCaptor<AlertEvent> eventCaptor = ArgumentCaptor.forClass(AlertEvent.class);
        verify(kafkaProducer, times(1)).sendAlertEvent(eventCaptor.capture());

        AlertEvent event = eventCaptor.getValue();
        assertEquals("P001", event.getPatientId());
        assertEquals("HIGH_HEART_RATE", event.getType());
        assertEquals(AlertStatus.NEW, event.getStatus());
        assertEquals(140, event.getHeartRate());
    }

    @Test
    void shouldNotSaveOrPublishDuplicateActiveAlert() {
        Alert activeAlert = new Alert();
        activeAlert.setAlertId("ALT-999");
        activeAlert.setPatientId("P001");
        activeAlert.setType("HIGH_HEART_RATE");
        activeAlert.setStatus(AlertStatus.NEW);

        when(repository.findByPatientIdAndTypeAndStatusNot(eq("P001"), eq("HIGH_HEART_RATE"), eq(AlertStatus.CLOSED)))
                .thenReturn(List.of(activeAlert));

        VitalMessage message = new VitalMessage();
        message.setPatientId("P001");
        message.setHeartRate(145);
        message.setSpo2(98);

        service.processVitals(message);

        verify(repository, never()).save(any(Alert.class));
        verify(kafkaProducer, never()).sendAlertEvent(any(AlertEvent.class));
    }

    @Test
    void shouldCreateAndPublishOneEventPerViolationType() {
        when(repository.findByPatientIdAndTypeAndStatusNot(any(), any(), eq(AlertStatus.CLOSED)))
                .thenReturn(Collections.emptyList());
        when(repository.save(any(Alert.class))).thenAnswer(inv -> inv.getArgument(0));

        VitalMessage message = new VitalMessage();
        message.setPatientId("P002");
        message.setHeartRate(145);
        message.setSpo2(87);
        message.setTemperature(39.5);

        service.processVitals(message);

        verify(repository, times(3)).save(any(Alert.class));

        ArgumentCaptor<AlertEvent> eventCaptor = ArgumentCaptor.forClass(AlertEvent.class);
        verify(kafkaProducer, times(3)).sendAlertEvent(eventCaptor.capture());

        List<AlertEvent> events = eventCaptor.getAllValues();
        assertEquals(3, events.size());
        assertTrue(events.stream().anyMatch(e -> "HIGH_HEART_RATE".equals(e.getType())));
        assertTrue(events.stream().anyMatch(e -> "OXYGEN_ALERT".equals(e.getType())));
        assertTrue(events.stream().anyMatch(e -> "HIGH_TEMPERATURE".equals(e.getType())));
    }

    @Test
    void shouldPreserveSavedAlertWhenKafkaFails() {
        @SuppressWarnings("unchecked")
        org.springframework.kafka.core.KafkaTemplate<String, AlertEvent> kafkaTemplate = mock(org.springframework.kafka.core.KafkaTemplate.class);
        when(kafkaTemplate.send(any(), any(), any())).thenThrow(new RuntimeException("Kafka connection refused"));

        AlertKafkaProducer realProducer = new AlertKafkaProducer(kafkaTemplate);
        AlertService serviceWithRealProducer = new AlertService(repository, realProducer, patientClient, healthTwinClient, flaskClient);

        when(repository.findByPatientIdAndTypeAndStatusNot(eq("P003"), eq("HIGH_HEART_RATE"), eq(AlertStatus.CLOSED)))
                .thenReturn(Collections.emptyList());
        when(repository.save(any(Alert.class))).thenAnswer(inv -> inv.getArgument(0));

        VitalMessage message = new VitalMessage();
        message.setPatientId("P003");
        message.setHeartRate(140);
        message.setSpo2(98);

        // processVitals should not crash or throw even when Kafka fails
        serviceWithRealProducer.processVitals(message);

        verify(repository, times(1)).save(any(Alert.class));
        verify(kafkaTemplate, times(1)).send(any(), any(), any());
    }

    private boolean assertTrue(boolean condition) {
        org.junit.jupiter.api.Assertions.assertTrue(condition);
        return condition;
    }
}
