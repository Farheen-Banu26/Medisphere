package com.infosys.fhir_service.dto;

import java.util.Map;

public class MedicationDTO {
    private String id;
    private String medication;
    private String status;

    public static MedicationDTO fromMap(Map<String, Object> resource) {
        MedicationDTO dto = new MedicationDTO();
        dto.setId(String.valueOf(resource.getOrDefault("id", "")));
        Map<String, Object> med = resource.containsKey("medicationCodeableConcept") && resource.get("medicationCodeableConcept") instanceof Map<?, ?> concept
                ? (Map<String, Object>) concept
                : null;
        if (med != null && med.get("text") != null) {
            dto.setMedication(String.valueOf(med.get("text")));
        }
        dto.setStatus(String.valueOf(resource.getOrDefault("status", "")));
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getMedication() { return medication; }
    public void setMedication(String medication) { this.medication = medication; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
