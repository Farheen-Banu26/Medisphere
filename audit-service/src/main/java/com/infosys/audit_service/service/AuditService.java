package com.infosys.audit_service.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.infosys.audit_service.model.AuditLog;
import com.infosys.audit_service.repository.AuditLogRepository;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository repository;

    public List<AuditLog> getLogs() {
        return repository.findAllByOrderByTimestampDesc();
    }

    public List<AuditLog> getLogsSecured(jakarta.servlet.http.HttpServletRequest request) {
        verifyAuditLogAccess(request);
        return getLogs();
    }

    public void verifyAuditLogAccess(jakarta.servlet.http.HttpServletRequest request) {
        if (request == null) return;
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return;
        String token = authHeader.substring(7).trim();
        String[] parts = token.split("\\.");
        if (parts.length < 2) return;
        try {
            String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(parts[1]), java.nio.charset.StandardCharsets.UTF_8);
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(payloadJson);
            if (root.has("realm_access") && root.get("realm_access").has("roles")) {
                boolean isPatient = false;
                boolean isAdminOrClinical = false;
                for (com.fasterxml.jackson.databind.JsonNode r : root.get("realm_access").get("roles")) {
                    String role = r.asText().toUpperCase();
                    if ("PATIENT".equals(role)) isPatient = true;
                    if ("ADMIN".equals(role) || "DOCTOR".equals(role) || "NURSE".equals(role)) isAdminOrClinical = true;
                }
                if (isPatient && !isAdminOrClinical) {
                    throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.FORBIDDEN,
                        "Access Denied: Patient role cannot view system audit logs"
                    );
                }
            }
        } catch (org.springframework.web.server.ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {}
    }

    public AuditLog saveLog(AuditLog log) {
        return repository.save(log);
    }
}
