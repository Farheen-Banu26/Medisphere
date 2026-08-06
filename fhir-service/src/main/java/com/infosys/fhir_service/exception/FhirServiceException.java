package com.infosys.fhir_service.exception;

public class FhirServiceException extends RuntimeException {
    private final String code;

    public FhirServiceException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
