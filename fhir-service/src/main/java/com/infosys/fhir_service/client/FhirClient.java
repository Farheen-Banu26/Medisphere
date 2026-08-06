package com.infosys.fhir_service.client;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.infosys.fhir_service.dto.AllergyIntoleranceDTO;
import com.infosys.fhir_service.dto.ConditionDTO;
import com.infosys.fhir_service.dto.FhirBundleDTO;
import com.infosys.fhir_service.dto.FhirPatientDTO;
import com.infosys.fhir_service.dto.MedicationDTO;
import com.infosys.fhir_service.dto.ObservationDTO;
import com.infosys.fhir_service.dto.ProcedureDTO;
import com.infosys.fhir_service.exception.FhirServiceException;

import reactor.core.publisher.Mono;

@Component
public class FhirClient {

    private static final Logger logger = LoggerFactory.getLogger(FhirClient.class);
    private static final String PATIENT_IDENTIFIER_SYSTEM = "http://medisphere.org/patient-id";
    private final WebClient webClient;

    public FhirClient(@Value("${fhir.server.url:https://hapi.fhir.org/baseR4}") String baseUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public FhirPatientDTO getPatient(String patientId) {
        if (patientId == null || patientId.isBlank()) {
            throw new FhirServiceException("400", "Invalid patient ID");
        }

        try {
            String identifierParam = formatPatientIdentifier(patientId);
            FhirBundleDTO bundle = webClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/Patient").queryParam("identifier", identifierParam).build())
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, response -> Mono.error(new FhirServiceException("404", "Patient not found by identifier or name")))
                    .onStatus(HttpStatusCode::is5xxServerError, response -> Mono.error(new FhirServiceException("500", "FHIR server unavailable")))
                    .bodyToMono(FhirBundleDTO.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            if (bundle == null || bundle.getResourceType() == null || !"Bundle".equals(bundle.getResourceType())) {
                throw new FhirServiceException("500", "Malformed FHIR response");
            }

            if (bundle.getEntry() == null || bundle.getEntry().isEmpty()) {
                throw new FhirServiceException("404", "Patient not found by identifier or name");
            }

            Map<String, Object> first = bundle.getEntry().get(0).getResource();
            return mapPatient(first);
        } catch (WebClientResponseException e) {
            if (e.getStatusCode().value() == 404) {
                throw new FhirServiceException("404", "Patient not found by identifier or name");
            }
            throw new FhirServiceException(String.valueOf(e.getStatusCode().value()), e.getMessage());
        } catch (FhirServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new FhirServiceException("500", "Malformed FHIR response");
        }
    }

    public boolean pingServer() {
        try {
            webClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/Patient").queryParam("_count", 1).build())
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, response -> Mono.error(new FhirServiceException("500", "FHIR server returned invalid response")))
                    .onStatus(HttpStatusCode::is5xxServerError, response -> Mono.error(new FhirServiceException("500", "FHIR server unavailable")))
                    .bodyToMono(Void.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();
            return true;
        } catch (WebClientResponseException e) {
            throw new FhirServiceException(String.valueOf(e.getStatusCode().value()), e.getMessage());
        } catch (FhirServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new FhirServiceException("500", "FHIR server unreachable");
        }
    }

    public Map<String, Object> createPatient(Map<String, Object> patientPayload) {
        validatePatientPayload(patientPayload);
        logger.info("Creating FHIR Patient payload: {}", patientPayload);
        try {
            Map<String, Object> response = webClient.post()
                    .uri("/Patient")
                    .header("Content-Type", "application/fhir+json")
                    .header("Accept", "application/fhir+json")
                    .bodyValue(patientPayload)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, clientResponse -> clientResponse.bodyToMono(String.class)
                            .defaultIfEmpty("")
                            .flatMap(body -> {
                                logger.error("FHIR create patient failed with HTTP {} and body {}", clientResponse.statusCode().value(), body);
                                return Mono.error(new FhirServiceException(String.valueOf(clientResponse.statusCode().value()), body));
                            }))
                    .onStatus(HttpStatusCode::is5xxServerError, serverResponse -> serverResponse.bodyToMono(String.class)
                            .defaultIfEmpty("")
                            .flatMap(body -> {
                                logger.error("FHIR create patient failed with HTTP {} and body {}", serverResponse.statusCode().value(), body);
                                return Mono.error(new FhirServiceException(String.valueOf(serverResponse.statusCode().value()), body));
                            }))
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            if (response == null || response.get("resourceType") == null || !"Patient".equals(response.get("resourceType"))) {
                throw new FhirServiceException("500", "Malformed FHIR patient creation response");
            }

            return response;
        } catch (WebClientResponseException e) {
            logger.error("FHIR create patient exception", e);
            throw new FhirServiceException(String.valueOf(e.getStatusCode().value()), e.getResponseBodyAsString());
        } catch (FhirServiceException e) {
            throw e;
        } catch (Exception e) {
            logger.error("FHIR create patient failed", e);
            throw new FhirServiceException("500", "Malformed FHIR patient creation response");
        }
    }

    public Map<String, Object> updatePatient(String fhirId, Map<String, Object> patientPayload) {
        validatePatientPayload(patientPayload);
        logger.info("Updating FHIR Patient {} payload: {}", fhirId, patientPayload);
        try {
            Map<String, Object> response = webClient.put()
                    .uri("/Patient/{id}", fhirId)
                    .header("Content-Type", "application/fhir+json")
                    .header("Accept", "application/fhir+json")
                    .bodyValue(patientPayload)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, clientResponse -> clientResponse.bodyToMono(String.class)
                            .defaultIfEmpty("")
                            .flatMap(body -> {
                                logger.error("FHIR update patient failed with HTTP {} and body {}", clientResponse.statusCode().value(), body);
                                return Mono.error(new FhirServiceException(String.valueOf(clientResponse.statusCode().value()), body));
                            }))
                    .onStatus(HttpStatusCode::is5xxServerError, serverResponse -> serverResponse.bodyToMono(String.class)
                            .defaultIfEmpty("")
                            .flatMap(body -> {
                                logger.error("FHIR update patient failed with HTTP {} and body {}", serverResponse.statusCode().value(), body);
                                return Mono.error(new FhirServiceException(String.valueOf(serverResponse.statusCode().value()), body));
                            }))
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            if (response == null || response.get("resourceType") == null || !"Patient".equals(response.get("resourceType"))) {
                throw new FhirServiceException("500", "Malformed FHIR patient update response");
            }
            return response;
        } catch (WebClientResponseException e) {
            logger.error("FHIR update patient exception", e);
            throw new FhirServiceException(String.valueOf(e.getStatusCode().value()), e.getResponseBodyAsString());
        } catch (FhirServiceException e) {
            throw e;
        } catch (Exception e) {
            logger.error("FHIR update patient failed", e);
            throw new FhirServiceException("500", "Malformed FHIR patient update response");
        }
    }

    private void validatePatientPayload(Map<String, Object> patientPayload) {
        if (patientPayload == null) {
            throw new FhirServiceException("400", "FHIR patient payload is null");
        }
        if (!"Patient".equals(patientPayload.get("resourceType"))) {
            throw new FhirServiceException("400", "FHIR patient payload must have resourceType=Patient");
        }
        if (patientPayload.get("identifier") == null) {
            throw new FhirServiceException("400", "FHIR patient payload must include identifier");
        }
        if (patientPayload.get("name") == null) {
            throw new FhirServiceException("400", "FHIR patient payload must include name");
        }
        if (patientPayload.get("gender") == null) {
            throw new FhirServiceException("400", "FHIR patient payload must include gender");
        }
        if (patientPayload.get("birthDate") == null) {
            throw new FhirServiceException("400", "FHIR patient payload must include birthDate");
        }
    }

    public Map<String, Object> getPatientResourceByIdentifier(String patientId) {
        try {
            String identifierParam = formatPatientIdentifier(patientId);
            FhirBundleDTO bundle = webClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/Patient").queryParam("identifier", identifierParam).build())
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, response -> Mono.error(new FhirServiceException("404", "Patient not found by identifier")))
                    .onStatus(HttpStatusCode::is5xxServerError, response -> Mono.error(new FhirServiceException("500", "FHIR server unavailable")))
                    .bodyToMono(FhirBundleDTO.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            if (bundle == null || bundle.getResourceType() == null || !"Bundle".equals(bundle.getResourceType())) {
                throw new FhirServiceException("500", "Malformed FHIR response");
            }

            if (bundle.getEntry() == null || bundle.getEntry().isEmpty()) {
                throw new FhirServiceException("404", "Patient not found by identifier");
            }

            return bundle.getEntry().get(0).getResource();
        } catch (WebClientResponseException e) {
            if (e.getStatusCode().value() == 404) {
                throw new FhirServiceException("404", "Patient not found by identifier");
            }
            throw new FhirServiceException(String.valueOf(e.getStatusCode().value()), e.getMessage());
        } catch (FhirServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new FhirServiceException("500", "Malformed FHIR response");
        }
    }

    private String formatPatientIdentifier(String patientId) {
        return PATIENT_IDENTIFIER_SYSTEM + "|" + patientId;
    }

    public List<ObservationDTO> getObservations(String patientId) {
        String fhirId = resolveFhirPatientId(patientId);
        return getObservationsByFhirId(fhirId);
    }

    public List<ObservationDTO> getObservationsByFhirId(String fhirId) {
        return fetchResources("/Observation", fhirId, ObservationDTO::fromMap);
    }

    public List<MedicationDTO> getMedications(String patientId) {
        String fhirId = resolveFhirPatientId(patientId);
        return getMedicationsByFhirId(fhirId);
    }

    public List<MedicationDTO> getMedicationsByFhirId(String fhirId) {
        return fetchResources("/MedicationRequest", fhirId, MedicationDTO::fromMap);
    }

    public List<ConditionDTO> getConditions(String patientId) {
        String fhirId = resolveFhirPatientId(patientId);
        return getConditionsByFhirId(fhirId);
    }

    public List<ConditionDTO> getConditionsByFhirId(String fhirId) {
        return fetchResources("/Condition", fhirId, ConditionDTO::fromMap);
    }

    public List<ProcedureDTO> getProcedures(String patientId) {
        String fhirId = resolveFhirPatientId(patientId);
        return getProceduresByFhirId(fhirId);
    }

    public List<ProcedureDTO> getProceduresByFhirId(String fhirId) {
        return fetchResources("/Procedure", fhirId, ProcedureDTO::fromMap);
    }

    public List<AllergyIntoleranceDTO> getAllergies(String patientId) {
        String fhirId = resolveFhirPatientId(patientId);
        return getAllergiesByFhirId(fhirId);
    }

    public List<AllergyIntoleranceDTO> getAllergiesByFhirId(String fhirId) {
        return fetchResources("/AllergyIntolerance", fhirId, AllergyIntoleranceDTO::fromMap);
    }

    private String resolveFhirPatientId(String patientId) {
        FhirPatientDTO patient = getPatient(patientId);
        if (patient == null || patient.getId() == null || patient.getId().isBlank()) {
            throw new FhirServiceException("404", "FHIR patient identifier not found");
        }
        return patient.getId();
    }

    private FhirPatientDTO searchPatientByIdentifier(String identifier) {
        FhirPatientDTO patient = trySearchPatientByIdentifierExact(identifier);
        if (patient != null) {
            return patient;
        }

        patient = trySearchPatientByIdentifierExact(identifier.toUpperCase());
        if (patient != null) {
            return patient;
        }

        patient = trySearchPatientByIdentifierExact(identifier.toLowerCase());
        if (patient != null) {
            return patient;
        }

        patient = trySearchPatientByIdentifier(identifier);
        if (patient != null) {
            return patient;
        }

        patient = trySearchPatientByIdentifier(identifier.toUpperCase());
        if (patient != null) {
            return patient;
        }

        patient = trySearchPatientByIdentifier(identifier.toLowerCase());
        if (patient != null) {
            return patient;
        }

        patient = trySearchPatientByName(identifier);
        if (patient != null) {
            return patient;
        }

        throw new FhirServiceException("404", "Patient not found by identifier or name");
    }

    private FhirPatientDTO trySearchPatientByIdentifierExact(String identifier) {
        return trySearchPatient("identifier:exact", identifier);
    }

    private FhirPatientDTO trySearchPatientByIdentifier(String identifier) {
        return trySearchPatient("identifier", identifier);
    }

    private FhirPatientDTO trySearchPatientByName(String name) {
        return trySearchPatient("name", name);
    }

    private FhirPatientDTO trySearchPatient(String parameter, String value) {
        try {
            FhirBundleDTO bundle = webClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/Patient").queryParam(parameter, value).build())
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, response -> Mono.error(new FhirServiceException("404", "Patient not found")))
                    .onStatus(HttpStatusCode::is5xxServerError, response -> Mono.error(new FhirServiceException("500", "FHIR server unavailable")))
                    .bodyToMono(FhirBundleDTO.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            if (bundle == null || bundle.getEntry() == null || bundle.getEntry().isEmpty()) {
                return null;
            }
            Map<String, Object> first = bundle.getEntry().get(0).getResource();
            return mapPatient(first);
        } catch (WebClientResponseException e) {
            if (e.getStatusCode().is4xxClientError()) {
                return null;
            }
            throw new FhirServiceException(String.valueOf(e.getStatusCode().value()), e.getMessage());
        } catch (FhirServiceException e) {
            if ("404".equals(e.getCode())) {
                return null;
            }
            throw e;
        } catch (Exception e) {
            throw new FhirServiceException("500", "Malformed FHIR response");
        }
    }

    private List<Map<String, Object>> getList(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        if (value instanceof List<?> list) {
            return list.stream()
                    .filter(item -> item instanceof Map<?, ?>)
                    .map(item -> (Map<String, Object>) item)
                    .toList();
        }
        return Collections.emptyList();
    }

    @SuppressWarnings("unchecked")
    private List<String> getListOfStrings(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        if (value instanceof List<?> list) {
            return list.stream().filter(String.class::isInstance).map(String.class::cast).toList();
        }
        return Collections.emptyList();
    }

    private FhirBundleDTO fetchBundle(String resourcePath, String fhirPatientId) {
        try {
            FhirBundleDTO bundle = webClient.get()
                    .uri(uriBuilder -> uriBuilder.path(resourcePath).queryParam("patient", fhirPatientId).build())
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, response -> Mono.error(new FhirServiceException("404", "No resources found")))
                    .onStatus(HttpStatusCode::is5xxServerError, response -> Mono.error(new FhirServiceException("500", "FHIR server unavailable")))
                    .bodyToMono(FhirBundleDTO.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            if (bundle == null || bundle.getResourceType() == null || !"Bundle".equals(bundle.getResourceType())) {
                throw new FhirServiceException("500", "Malformed FHIR response");
            }
            return bundle;
        } catch (WebClientResponseException e) {
            throw new FhirServiceException(String.valueOf(e.getStatusCode().value()), e.getMessage());
        } catch (FhirServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new FhirServiceException("500", "Malformed FHIR response");
        }
    }

    private <T> List<T> fetchResources(String resourcePath, String fhirPatientId, Function<Map<String, Object>, T> mapper) {
        FhirBundleDTO bundle = fetchBundle(resourcePath, fhirPatientId);
        if (bundle == null || bundle.getEntry() == null) {
            return Collections.emptyList();
        }
        return bundle.getEntry().stream()
                .filter(entry -> entry.getResource() != null)
                .map(entry -> mapper.apply(entry.getResource()))
                .toList();
    }

    private FhirPatientDTO mapPatient(Map<String, Object> payload) {
        if (payload == null || payload.get("resourceType") == null || !"Patient".equals(payload.get("resourceType"))) {
            throw new FhirServiceException("500", "Malformed FHIR response");
        }
        FhirPatientDTO dto = new FhirPatientDTO();
        dto.setId(getString(payload, "id"));
        dto.setResourceType(getString(payload, "resourceType"));
        List<Map<String, Object>> names = getList(payload, "name");
        if (!names.isEmpty()) {
            Map<String, Object> name = names.get(0);
            dto.setFamilyName(getString(name, "family"));
            List<String> givenNames = getListOfStrings(name, "given");
            dto.setGivenNames(givenNames);
        }
        dto.setBirthDate(getString(payload, "birthDate"));
        dto.setGender(getString(payload, "gender"));
        return dto;
    }

    @SuppressWarnings("unchecked")
    private String getString(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        return value == null ? null : String.valueOf(value);
    }
}
