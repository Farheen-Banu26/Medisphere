package com.infosys.fhir_service.dto;

import java.util.List;
import java.util.Map;

public class ConditionDTO {
    private String id;
    private String code;
    private String clinicalStatus;
    private String verificationStatus;
    private String onsetDate;
    private List<String> categories;

    public static ConditionDTO fromMap(Map<String, Object> resource) {
        ConditionDTO dto = new ConditionDTO();
        dto.setId(String.valueOf(resource.getOrDefault("id", "")));
        dto.setClinicalStatus(getString(resource, "clinicalStatus"));
        dto.setVerificationStatus(getString(resource, "verificationStatus"));
        dto.setOnsetDate(getString(resource, "onsetDateTime"));
        if (dto.getOnsetDate() == null) {
            dto.setOnsetDate(getString(resource, "recordedDate"));
        }
        Map<String, Object> code = getMap(resource, "code");
        if (code != null) {
            dto.setCode(getString(code, "text"));
            if (dto.getCode() == null && code.get("coding") instanceof List<?> codingList && !codingList.isEmpty()) {
                Object first = codingList.get(0);
                if (first instanceof Map<?, ?> firstMap) {
                    dto.setCode(getString((Map<String, Object>) firstMap, "display"));
                }
            }
        }
        dto.setCategories(getStringList(resource, "category"));
        return dto;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> getMap(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        return value instanceof Map<?, ?> map ? (Map<String, Object>) map : null;
    }

    @SuppressWarnings("unchecked")
    private static List<String> getStringList(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        if (value instanceof List<?> list) {
            return list.stream().filter(String.class::isInstance).map(String.class::cast).toList();
        }
        return List.of();
    }

    private static String getString(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        return value == null ? null : String.valueOf(value);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getClinicalStatus() { return clinicalStatus; }
    public void setClinicalStatus(String clinicalStatus) { this.clinicalStatus = clinicalStatus; }
    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }
    public String getOnsetDate() { return onsetDate; }
    public void setOnsetDate(String onsetDate) { this.onsetDate = onsetDate; }
    public List<String> getCategories() { return categories; }
    public void setCategories(List<String> categories) { this.categories = categories; }
}
