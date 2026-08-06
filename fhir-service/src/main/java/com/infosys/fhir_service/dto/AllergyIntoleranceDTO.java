package com.infosys.fhir_service.dto;

import java.util.List;
import java.util.Map;

public class AllergyIntoleranceDTO {
    private String id;
    private String clinicalStatus;
    private String verificationStatus;
    private String category;
    private String criticality;
    private List<String> reactions;
    private String substance;

    public static AllergyIntoleranceDTO fromMap(Map<String, Object> resource) {
        AllergyIntoleranceDTO dto = new AllergyIntoleranceDTO();
        dto.setId(String.valueOf(resource.getOrDefault("id", "")));
        dto.setClinicalStatus(String.valueOf(resource.getOrDefault("clinicalStatus", "")));
        dto.setVerificationStatus(String.valueOf(resource.getOrDefault("verificationStatus", "")));
        dto.setCategory(String.valueOf(resource.getOrDefault("category", "")));
        dto.setCriticality(String.valueOf(resource.getOrDefault("criticality", "")));

        Map<String, Object> substance = resource.containsKey("substance") && resource.get("substance") instanceof Map<?, ?> map
                ? (Map<String, Object>) map
                : null;
        if (substance != null) {
            dto.setSubstance(String.valueOf(substance.getOrDefault("text", substance.getOrDefault("display", ""))));
        }

        if (resource.get("reaction") instanceof List<?> reactionList) {
            dto.setReactions(reactionList.stream()
                    .filter(Map.class::isInstance)
                    .map(Map.class::cast)
                    .map(reaction -> {
                        Map<String, Object> detail = reaction.containsKey("substance") && reaction.get("substance") instanceof Map<?, ?> substanceMap
                                ? (Map<String, Object>) substanceMap
                                : null;
                        return detail == null ? null : String.valueOf(detail.getOrDefault("text", detail.getOrDefault("display", "")));
                    })
                    .filter(item -> item != null)
                    .toList());
        }

        return dto;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getClinicalStatus() {
        return clinicalStatus;
    }

    public void setClinicalStatus(String clinicalStatus) {
        this.clinicalStatus = clinicalStatus;
    }

    public String getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(String verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getCriticality() {
        return criticality;
    }

    public void setCriticality(String criticality) {
        this.criticality = criticality;
    }

    public List<String> getReactions() {
        return reactions;
    }

    public void setReactions(List<String> reactions) {
        this.reactions = reactions;
    }

    public String getSubstance() {
        return substance;
    }

    public void setSubstance(String substance) {
        this.substance = substance;
    }
}
