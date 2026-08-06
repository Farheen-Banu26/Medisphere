package com.infosys.fhir_service.dto;

import java.util.Map;

public class FhirBundleEntryDTO {
    private Map<String, Object> resource;

    public Map<String, Object> getResource() {
        return resource;
    }

    public void setResource(Map<String, Object> resource) {
        this.resource = resource;
    }
}
