package com.infosys.wearable_simulator.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.infosys.wearable_simulator.model.VitalMessage;

@Service
public class WearableService {

    private static final Logger logger = LoggerFactory.getLogger(WearableService.class);

    private final RestTemplate restTemplate;
    private final String vitalsEndpoint;

    public WearableService(@Value("${vitals.service.url:http://localhost:8992/api/vitals}") String vitalsEndpoint) {
        this.restTemplate = new RestTemplate();
        this.vitalsEndpoint = vitalsEndpoint;
    }

    public boolean sendVitals(VitalMessage vitalMessage) {
        logger.info("Generated vitals for patient {}", vitalMessage.getPatientId());
        logger.info("Sending to Vitals Service");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<VitalMessage> request = new HttpEntity<>(vitalMessage, headers);

        try {
            restTemplate.postForEntity(vitalsEndpoint, request, Void.class);
            logger.info("Vitals sent successfully for patient {}", vitalMessage.getPatientId());
            return true;
        } catch (RestClientException ex) {
            logger.error("Connection failed while sending vitals for patient {}", vitalMessage.getPatientId(), ex);
            return false;
        }
    }
}
