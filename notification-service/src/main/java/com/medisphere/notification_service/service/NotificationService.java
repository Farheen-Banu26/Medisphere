package com.medisphere.notification_service.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
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
    private final AuditClient auditClient;

    @Autowired
    public NotificationService(
            NotificationRepository repository,
            NotificationRoutingService routingService,
            NotificationKafkaProducer kafkaProducer,
            AlertServiceClient alertServiceClient,
            EmailService emailService,
            AuditClient auditClient) {
        this.repository = repository;
        this.routingService = routingService;
        this.kafkaProducer = kafkaProducer;
        this.alertServiceClient = alertServiceClient;
        this.emailService = emailService;
        this.auditClient = auditClient;
    }

    // ===========================================
    // Security Context & Authorization Guards
    // ===========================================
    public static class SecurityUserContext {
        public String username;
        public String email;
        public java.util.List<String> roles = new java.util.ArrayList<>();
        public boolean isAdmin = false;
        public boolean isDoctor = false;
        public boolean isPatient = false;
    }

    public SecurityUserContext parseSecurityContext(jakarta.servlet.http.HttpServletRequest request) {
        SecurityUserContext ctx = new SecurityUserContext();
        if (request == null) return ctx;
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return ctx;
        String token = authHeader.substring(7).trim();
        String[] parts = token.split("\\.");
        if (parts.length < 2) return ctx;
        try {
            String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(parts[1]), java.nio.charset.StandardCharsets.UTF_8);
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(payloadJson);
            if (root.has("preferred_username")) ctx.username = root.get("preferred_username").asText();
            if (root.has("email")) ctx.email = root.get("email").asText();
            if (root.has("realm_access") && root.get("realm_access").has("roles")) {
                for (com.fasterxml.jackson.databind.JsonNode r : root.get("realm_access").get("roles")) {
                    String role = r.asText().toUpperCase();
                    ctx.roles.add(role);
                    if ("ADMIN".equals(role)) ctx.isAdmin = true;
                    if ("DOCTOR".equals(role)) ctx.isDoctor = true;
                    if ("PATIENT".equals(role)) ctx.isPatient = true;
                }
            }
        } catch (Exception ex) {}
        return ctx;
    }

    public String resolveDoctorId(String doctorIdentifier) {
        if (doctorIdentifier == null || doctorIdentifier.trim().isEmpty()) return "D001";
        String normalized = doctorIdentifier.trim().toLowerCase();
        return switch (normalized) {
            case "doctor", "d001", "dr_jenkins", "sarah" -> "D001";
            case "dr_smith", "d002", "robert"            -> "D002";
            case "dr_jones", "d003", "emily"             -> "D003";
            case "dr_patel", "d004", "rajesh"            -> "D004";
            case "dr_chen",  "d005", "michael"           -> "D005";
            default -> doctorIdentifier.toUpperCase();
        };
    }

    public String resolvePatientId(String username, String email) {
        if ("patient".equalsIgnoreCase(username) || "patient@medisphere.com".equalsIgnoreCase(email)) return "P1002";
        if ("farheen".equalsIgnoreCase(username) || "banufarheen786786@gmail.com".equalsIgnoreCase(email)) return "P1001";
        if (username != null && !username.trim().isEmpty()) return username.trim().toUpperCase();
        return "P1002";
    }

    @org.springframework.beans.factory.annotation.Value("${patient.service.base-url:http://localhost:8989}")
    private String patientServiceBaseUrl;

    private final org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

    public boolean isPatientAssignedToDoctor(String docId, String targetPatientId) {
        try {
            String baseUrl = (patientServiceBaseUrl != null && !patientServiceBaseUrl.trim().isEmpty()) ? patientServiceBaseUrl : "http://localhost:8989";
            String url = baseUrl + "/api/patients/" + targetPatientId;
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> patient = restTemplate.getForObject(url, java.util.Map.class);
            if (patient == null) return false;
            Object assignedDoctorId = patient.get("assignedDoctorId");
            if (assignedDoctorId == null) return false;
            String assignedId = assignedDoctorId.toString();
            return assignedId.equalsIgnoreCase(docId) || assignedId.equalsIgnoreCase(resolveDoctorId(docId));
        } catch (org.springframework.web.client.HttpClientErrorException.NotFound ex) {
            return false;
        } catch (Exception ex) {
            System.err.println("NotificationService: patient-service lookup failed for assignment check: " + ex.getMessage());
            return false;
        }
    }

    public void verifyPatientResourceAccess(String targetPatientId, jakarta.servlet.http.HttpServletRequest request) {
        SecurityUserContext ctx = parseSecurityContext(request);
        if (ctx.username == null || ctx.username.trim().isEmpty()) return;

        if (ctx.isAdmin) return;

        if (ctx.isPatient) {
            String myPatientId = resolvePatientId(ctx.username, ctx.email);
            if (!targetPatientId.equalsIgnoreCase(myPatientId)) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Access Denied: Patient " + myPatientId + " cannot access Patient " + targetPatientId + " Notifications"
                );
            }
        } else if (ctx.isDoctor) {
            String docId = resolveDoctorId(ctx.username);
            if (!isPatientAssignedToDoctor(docId, targetPatientId)) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Access Denied: Doctor " + docId + " cannot access Patient " + targetPatientId + " Notifications"
                );
            }
        }
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
                logger.info("Duplicate notification for alert {} ({}, {}) - skipping",
                        event.getAlertId(), route.getRecipientType(), route.getChannel());
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

            // Audit: NOTIFICATION_CREATED
            auditClient.log("NOTIFICATION_CREATED", "system", "SYSTEM",
                    event.getPatientId(), "SUCCESS",
                    "Notification " + notification.getNotificationId()
                            + " created for alert " + event.getAlertId()
                            + " → " + route.getRecipient());

            if (emailService != null) {
                emailService.sendAlertEmail(notification, event);
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

                // Audit: NOTIFICATION_SENT
                auditClient.log("NOTIFICATION_SENT", "system", "SYSTEM",
                        event.getPatientId(), "SUCCESS",
                        "Notification " + notification.getNotificationId() + " sent via notification-stream");

                if (alertServiceClient != null) {
                    alertServiceClient.markAlertSent(notification.getAlertId());
                }
            } else {
                notification.setStatus(NotificationStatus.FAILED);
                repository.save(notification);
                logger.warn("Notification {} publication failed; marked as FAILED",
                        notification.getNotificationId());

                // Audit: NOTIFICATION_FAILED
                auditClient.log("NOTIFICATION_FAILED", "system", "SYSTEM",
                        event.getPatientId(), "ERROR",
                        "Notification " + notification.getNotificationId() + " failed to publish to Kafka");
            }
        }
    }

    public Notification markDelivered(String notificationId) {
        Notification notification = repository.findByNotificationId(notificationId)
                .orElseThrow(() -> new NotificationNotFoundException(
                        "Notification not found with id: " + notificationId));

        if (notification.getStatus() == NotificationStatus.DELIVERED) {
            return notification;
        }

        if (notification.getStatus() != NotificationStatus.SENT) {
            throw new InvalidLifecycleTransitionException(
                    "Cannot transition notification " + notificationId
                            + " from status " + notification.getStatus() + " to DELIVERED");
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
