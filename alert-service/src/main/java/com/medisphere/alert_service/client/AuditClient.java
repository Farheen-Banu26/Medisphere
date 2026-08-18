package com.medisphere.alert_service.client;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * Lightweight client that posts audit events to audit-service.
 * Failures are silently logged — audit must never block clinical alerts.
 */
@Component
public class AuditClient {

    private static final Logger logger = LoggerFactory.getLogger(AuditClient.class);

    private final RestTemplate restTemplate = new RestTemplate();
    private final String auditBaseUrl;

    public AuditClient(
            @Value("${audit.service.base-url:http://localhost:8994}") String auditBaseUrl) {
        this.auditBaseUrl = auditBaseUrl;
    }

    public void log(String action, String user, String role, String patientId,
                    String status, String details) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("action", action);
            payload.put("user", user != null ? user : "system");
            payload.put("role", role != null ? role : "SYSTEM");
            payload.put("patientId", patientId);
            payload.put("status", status != null ? status : "SUCCESS");
            payload.put("details", details);
            restTemplate.postForEntity(auditBaseUrl + "/api/audit/logs", payload, String.class);
        } catch (Exception ex) {
            logger.debug("Audit log write skipped (non-critical): {}", ex.getMessage());
        }
    }
}
