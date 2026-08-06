package com.infosys.fhir_service.exception;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class FhirExceptionHandler {

    @ExceptionHandler(FhirServiceException.class)
    public ResponseEntity<Map<String, Object>> handleFhirServiceException(FhirServiceException ex) {
        int status = switch (ex.getCode()) {
            case "400" -> HttpStatus.BAD_REQUEST.value();
            case "404" -> HttpStatus.NOT_FOUND.value();
            default -> HttpStatus.INTERNAL_SERVER_ERROR.value();
        };

        return ResponseEntity.status(status).body(Map.of(
                "error", ex.getMessage(),
                "code", ex.getCode()
        ));
    }
}
