package com.infosys.fhir_service.dto;

import java.util.List;

public class FhirBundleDTO {
    private String resourceType;
    private List<FhirBundleEntryDTO> entry;

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public List<FhirBundleEntryDTO> getEntry() {
        return entry;
    }

    public void setEntry(List<FhirBundleEntryDTO> entry) {
        this.entry = entry;
    }
}
