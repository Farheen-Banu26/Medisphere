package com.medisphere.notification_service.service;

import com.medisphere.notification_service.dto.AlertEvent;
import com.medisphere.notification_service.model.Notification;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    private final JavaMailSender mailSender;
    private final PatientClient patientClient;
    
    @Value("${medisphere.mail.from:noreply@medisphere.com}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender, PatientClient patientClient) {
        this.mailSender = mailSender;
        this.patientClient = patientClient;
    }

    public void sendAlertEmail(Notification notification, AlertEvent event) {
        if (!"HIGH".equalsIgnoreCase(event.getSeverity()) && !"CRITICAL".equalsIgnoreCase(event.getSeverity())) {
            return;
        }

        logger.info("Email sending started for notification {} (Alert: {})", notification.getNotificationId(), event.getAlertId());

        String recipientEmail = null;
        
        // Use PatientClient to get email
        var patient = patientClient.getPatient(event.getPatientId());
        if (patient != null && patient.email() != null && !patient.email().isBlank()) {
            recipientEmail = patient.email();
        }

        if (recipientEmail == null) {
            logger.info("Recipient email is unavailable for patient {}. Skipping email gracefully.", event.getPatientId());
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(recipientEmail);
            helper.setSubject("🚨 MediSphere Critical Health Alert");
            
            String htmlContent = buildHtmlContent(event, notification);
            helper.setText(htmlContent, true);

            mailSender.send(message);

            notification.setEmailSent(true);
            notification.setEmailSentAt(LocalDateTime.now());
            notification.setEmailStatus("SUCCESS");
            
            logger.info("Email sent successfully for alert {} to {}", event.getAlertId(), recipientEmail);

        } catch (Exception ex) {
            logger.error("Email failed for alert {}: {}", event.getAlertId(), ex.getMessage());
            notification.setEmailSent(false);
            notification.setEmailStatus("FAILED");
            // Do not throw the exception, let notification process continue
        }
    }

    private String buildHtmlContent(AlertEvent event, Notification notification) {
        StringBuilder sb = new StringBuilder();
        sb.append("<html><head><style>")
          .append("body { font-family: Arial, sans-serif; color: #333; }")
          .append(".header { background-color: #d9534f; color: white; padding: 15px; text-align: center; }")
          .append(".content { padding: 20px; }")
          .append(".footer { margin-top: 20px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; }")
          .append(".field-label { font-weight: bold; }")
          .append("</style></head><body>");

        sb.append("<div class='header'><h2>MediSphere Hospital</h2></div>");
        sb.append("<div class='content'>");
        sb.append("<h3>Alert Notification</h3>");
        
        sb.append("<p><span class='field-label'>Patient ID:</span> ").append(event.getPatientId()).append("</p>");
        sb.append("<p><span class='field-label'>Alert Type:</span> ").append(event.getType()).append("</p>");
        sb.append("<p><span class='field-label'>Severity:</span> ").append(event.getSeverity()).append("</p>");
        sb.append("<p><span class='field-label'>Message:</span> ").append(event.getMessage()).append("</p>");
        
        if (event.getPrediction() != null && !event.getPrediction().isBlank()) {
            sb.append("<p><span class='field-label'>AI Prediction:</span> ").append(event.getPrediction()).append("</p>");
        }
        if (event.getRisk() != null && !event.getRisk().isBlank()) {
            sb.append("<p><span class='field-label'>Risk Level:</span> ").append(event.getRisk()).append("</p>");
        }
        if (event.getConfidence() != null) {
            sb.append("<p><span class='field-label'>Confidence:</span> ").append(String.format("%.2f%%", event.getConfidence() * 100)).append("</p>");
        }
        
        sb.append("<p><span class='field-label'>Created Time:</span> ").append(event.getCreatedAt()).append("</p>");
        sb.append("<p><span class='field-label'>Status:</span> ").append(notification.getStatus()).append("</p>");
        
        sb.append("</div>");
        sb.append("<div class='footer'><p>This notification was generated automatically by MediSphere.</p></div>");
        sb.append("</body></html>");

        return sb.toString();
    }
}
