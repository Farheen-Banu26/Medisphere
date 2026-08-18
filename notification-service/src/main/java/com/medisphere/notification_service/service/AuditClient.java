package com.medisphere.notification_service.service;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * Posts audit events to audit-service. Failures are silently swallowed —
 * audit must never block notification delivery.
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

    public void log(String action, String user, String role,
                    String patientId, String status, String details) {
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
            logger.debug("Audit log skipped (non-critical): {}", ex.getMessage());
        }
    }
}
