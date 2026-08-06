package com.infosys.fhir_service.dto;

import java.util.Map;

public class ProcedureDTO {
    private String id;
    private String code;
    private String status;
    private String performedDate;

    public static ProcedureDTO fromMap(Map<String, Object> resource) {
        ProcedureDTO dto = new ProcedureDTO();
        dto.setId(String.valueOf(resource.getOrDefault("id", "")));
        dto.setStatus(String.valueOf(resource.getOrDefault("status", "")));
        dto.setPerformedDate(String.valueOf(resource.getOrDefault("performedDateTime", resource.getOrDefault("performedPeriod", ""))));

        Map<String, Object> code = resource.containsKey("code") && resource.get("code") instanceof Map<?, ?> map
                ? (Map<String, Object>) map
                : null;
        if (code != null) {
            dto.setCode(String.valueOf(code.getOrDefault("text", code.getOrDefault("display", ""))));
        }
        return dto;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPerformedDate() {
        return performedDate;
    }

    public void setPerformedDate(String performedDate) {
        this.performedDate = performedDate;
    }
}
