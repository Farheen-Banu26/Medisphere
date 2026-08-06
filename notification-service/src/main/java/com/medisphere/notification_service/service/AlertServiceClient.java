package com.medisphere.notification_service.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AlertServiceClient {

    private static final Logger logger = LoggerFactory.getLogger(AlertServiceClient.class);

    private final RestTemplate restTemplate;
    private final String baseUrl;

    @org.springframework.beans.factory.annotation.Autowired
    public AlertServiceClient(
            @Value("${medisphere.alert-service.base-url:http://localhost:9002}") String baseUrl) {
        this(new RestTemplate(), baseUrl);
    }

    public AlertServiceClient(RestTemplate restTemplate, String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    public void markAlertSent(String alertId) {
        if (alertId == null || alertId.isBlank()) {
            return;
        }
        try {
            String url = baseUrl + "/api/alerts/" + alertId + "/sent";
            restTemplate.put(url, null);
            logger.info("Successfully notified Alert Service of SENT status for alertId {}", alertId);
        } catch (Exception e) {
            logger.error("Failed to notify Alert Service of SENT status for alertId {}: {}", alertId, e.getMessage(), e);
        }
    }

    public void markAlertDelivered(String alertId) {
        if (alertId == null || alertId.isBlank()) {
            return;
        }
        try {
            String url = baseUrl + "/api/alerts/" + alertId + "/delivered";
            restTemplate.put(url, null);
            logger.info("Successfully notified Alert Service of DELIVERED status for alertId {}", alertId);
        } catch (Exception e) {
            logger.error("Failed to notify Alert Service of DELIVERED status for alertId {}: {}", alertId, e.getMessage(), e);
        }
    }
}
