package com.infosys.fhir_service.dto;

import java.util.Map;

public class ObservationDTO {
    private String id;
    private String code;
    private String value;
    private String date;

    public static ObservationDTO fromMap(Map<String, Object> resource) {
        ObservationDTO dto = new ObservationDTO();
        dto.setId(String.valueOf(resource.getOrDefault("id", "")));
        Map<String, Object> code = resource.containsKey("code") && resource.get("code") instanceof Map<?, ?> map
                ? (Map<String, Object>) map
                : null;
        if (code != null && code.get("text") != null) {
            dto.setCode(String.valueOf(code.get("text")));
        }
        Map<String, Object> value = resource.containsKey("valueQuantity") && resource.get("valueQuantity") instanceof Map<?, ?> quantity
                ? (Map<String, Object>) quantity
                : null;
        if (value != null && value.get("value") != null) {
            dto.setValue(String.valueOf(value.get("value")) + " " + String.valueOf(value.getOrDefault("unit", "")));
        }
        dto.setDate(String.valueOf(resource.getOrDefault("effectiveDateTime", "")));
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
}
