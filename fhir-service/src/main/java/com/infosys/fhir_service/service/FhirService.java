package com.infosys.fhir_service.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.infosys.fhir_service.client.FhirClient;
import com.infosys.fhir_service.client.PatientClient;
import com.infosys.fhir_service.dto.AllergyIntoleranceDTO;
import com.infosys.fhir_service.dto.ConditionDTO;
import com.infosys.fhir_service.dto.FhirPatientDTO;
import com.infosys.fhir_service.dto.MedicationDTO;
import com.infosys.fhir_service.dto.ProcedureDTO;
import com.infosys.fhir_service.dto.SyncResponseDTO;
import com.infosys.fhir_service.dto.ObservationDTO;
import com.infosys.fhir_service.exception.FhirServiceException;
import com.infosys.fhir_service.model.FhirPatient;
import com.infosys.fhir_service.model.FhirSyncHistory;
import com.infosys.fhir_service.repository.FhirRepository;
import com.infosys.fhir_service.repository.FhirSyncHistoryRepository;

@Service
public class FhirService {

    @Autowired
    private FhirRepository repository;

    @Autowired
    private FhirClient fhirClient;

    @Autowired
    private PatientClient patientClient;

    @Autowired
    private FhirSyncHistoryRepository historyRepository;

    private static final Logger logger = LoggerFactory.getLogger(FhirService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Connect

    public String connect() {
        return "Connected to FHIR Server Successfully";
    }

    // Import Patient

    public String importPatient(FhirPatient patient) {
        if (patient == null || patient.getPatientId() == null || patient.getPatientId().isBlank()) {
            throw new FhirServiceException("400", "Invalid patient ID");
        }
        syncPatient(patient.getPatientId());
        return "FHIR Patient Imported Successfully";
    }

    // Validate

    public String validate(FhirPatient patient) {
        if (patient.getPatientId() != null &&
                !patient.getPatientId().isBlank() &&
                patient.getResourceType() != null &&
                !patient.getResourceType().isBlank() &&
                patient.getResourceData() != null &&
                !patient.getResourceData().isBlank()) {
            return "FHIR Resource Valid";
        }

        return "FHIR Resource Invalid";
    }

    // Get All

    public List<FhirPatient> getResources() {
        return repository.findAll();
    }

    // Get By Patient

    public List<FhirPatient> getPatientResources(String patientId) {
        return repository.findByPatientIdIgnoreCase(patientId.trim());
    }

    public FhirPatientDTO getPatientById(String patientId) {
        return fhirClient.getPatient(patientId);
    }

    public List<ObservationDTO> getObservations(String patientId) {
        return fhirClient.getObservations(patientId);
    }

    public List<MedicationDTO> getMedications(String patientId) {
        return fhirClient.getMedications(patientId);
    }

    public List<ConditionDTO> getConditions(String patientId) {
        return fhirClient.getConditions(patientId);
    }

    public List<ProcedureDTO> getProcedures(String patientId) {
        return fhirClient.getProcedures(patientId);
    }

    public List<AllergyIntoleranceDTO> getAllergies(String patientId) {
        return fhirClient.getAllergies(patientId);
    }

    public List<FhirSyncHistory> getSyncHistory(String patientId) {
        if (patientId == null || patientId.isBlank()) {
            return historyRepository.findAllByOrderByStartedAtDesc();
        }
        return historyRepository.findByPatientIdOrderByStartedAtDesc(patientId);
    }

    public SyncResponseDTO syncPatient(String patientId) {
        if (patientId == null || patientId.isBlank()) {
            throw new FhirServiceException("400", "Invalid patient ID");
        }

        LocalDateTime syncStart = LocalDateTime.now();
        List<String> syncedResources = new ArrayList<>();

        try {
            Map<String, Object> localPatient = patientClient.getPatient(patientId);
            Map<String, Object> fhirPatientPayload = mapLocalPatientToFhirResource(localPatient);
            logger.info("Prepared FHIR Patient for {}: {}", patientId, fhirPatientPayload);

            Optional<FhirPatient> existingPatientRecord = repository.findByPatientIdIgnoreCaseAndResourceType(patientId, "Patient");
            String fhirId = existingPatientRecord.map(FhirPatient::getFhirId).orElse(null);

            Map<String, Object> fhirPatientResource;
            if (fhirId == null || fhirId.isBlank()) {
                fhirPatientResource = fhirClient.createPatient(fhirPatientPayload);
            } else {
                fhirPatientResource = fhirClient.updatePatient(fhirId, fhirPatientPayload);
            }

            fhirId = getResourceId(fhirPatientResource);
            if (fhirId == null || fhirId.isBlank()) {
                throw new FhirServiceException("500", "FHIR patient resource missing id");
            }

            saveFhirObject(patientId, fhirId, "Patient", fhirPatientResource);
            recordSyncHistory(patientId, "Patient", "SUCCESS", syncStart, LocalDateTime.now(), "Patient resource synchronized");
            syncedResources.add("Patient");

            List<ObservationDTO> observations = fhirClient.getObservationsByFhirId(fhirId);
            saveFhirObject(patientId, fhirId, "Observation", observations);
            recordSyncHistory(patientId, "Observation", "SUCCESS", syncStart, LocalDateTime.now(), "Observation resources synchronized");
            syncedResources.add("Observation");

            List<MedicationDTO> medications = fhirClient.getMedicationsByFhirId(fhirId);
            saveFhirObject(patientId, fhirId, "MedicationRequest", medications);
            recordSyncHistory(patientId, "MedicationRequest", "SUCCESS", syncStart, LocalDateTime.now(), "MedicationRequest resources synchronized");
            syncedResources.add("MedicationRequest");

            List<ConditionDTO> conditions = fhirClient.getConditionsByFhirId(fhirId);
            saveFhirObject(patientId, fhirId, "Condition", conditions);
            recordSyncHistory(patientId, "Condition", "SUCCESS", syncStart, LocalDateTime.now(), "Condition resources synchronized");
            syncedResources.add("Condition");

            List<ProcedureDTO> procedures = fhirClient.getProceduresByFhirId(fhirId);
            saveFhirObject(patientId, fhirId, "Procedure", procedures);
            recordSyncHistory(patientId, "Procedure", "SUCCESS", syncStart, LocalDateTime.now(), "Procedure resources synchronized");
            syncedResources.add("Procedure");

            List<AllergyIntoleranceDTO> allergies = fhirClient.getAllergiesByFhirId(fhirId);
            saveFhirObject(patientId, fhirId, "AllergyIntolerance", allergies);
            recordSyncHistory(patientId, "AllergyIntolerance", "SUCCESS", syncStart, LocalDateTime.now(), "AllergyIntolerance resources synchronized");
            syncedResources.add("AllergyIntolerance");

            return new SyncResponseDTO(
                    patientId,
                    "SUCCESS",
                    LocalDateTime.now(),
                    syncedResources
            );
        } catch (FhirServiceException ex) {
            logger.error("FHIR sync failed for patient {}", patientId, ex);
            recordSyncHistory(patientId, "ALL", "FAILED", syncStart, LocalDateTime.now(), ex.getMessage());
            throw ex;
        } catch (Exception ex) {
            logger.error("FHIR sync failed for patient {}", patientId, ex);
            recordSyncHistory(patientId, "ALL", "FAILED", syncStart, LocalDateTime.now(), ex.getMessage());
            throw new FhirServiceException("500", ex.getMessage());
        }
    }

    private void saveFhirObject(String patientId, String fhirId, String resourceType, Object payload) {
        try {
            String resourceData = objectMapper.writeValueAsString(payload);
            FhirPatient resource = new FhirPatient();
            resource.setPatientId(patientId);
            resource.setFhirId(fhirId);
            resource.setResourceType(resourceType);
            resource.setResourceData(resourceData);
            resource.setLastSynced(LocalDateTime.now());
            repository.save(resource);
        } catch (JsonProcessingException ex) {
            throw new FhirServiceException("500", "Unable to serialize FHIR resource");
        }
    }

    private String getResourceId(Map<String, Object> resource) {
        if (resource == null) {
            return null;
        }
        Object idValue = resource.get("id");
        return idValue == null ? null : String.valueOf(idValue);
    }

    private Map<String, Object> mapLocalPatientToFhirResource(Map<String, Object> localPatient) {
        if (localPatient == null || localPatient.get("patientId") == null) {
            throw new FhirServiceException("404", "Local patient not found");
        }

        String patientId = String.valueOf(localPatient.get("patientId"));
        String firstName = getString(localPatient, "firstName");
        String lastName = getString(localPatient, "lastName");
        String gender = normalizeGender(getString(localPatient, "gender"));
        String birthDate = getString(localPatient, "dob");
        String email = getString(localPatient, "email");
        String phone = getString(localPatient, "phone");
        String address = getString(localPatient, "address");

        Map<String, Object> patientResource = new HashMap<>();
        patientResource.put("resourceType", "Patient");
        patientResource.put("identifier", List.of(Map.of("system", "http://medisphere.org/patient-id", "value", patientId)));

        if (lastName != null || firstName != null) {
            Map<String, Object> name = new HashMap<>();
            if (lastName != null) {
                name.put("family", lastName);
            }
            if (firstName != null) {
                name.put("given", List.of(firstName));
            }
            patientResource.put("name", List.of(name));
        }

        if (gender != null) {
            patientResource.put("gender", gender);
        }
        if (birthDate != null) {
            patientResource.put("birthDate", birthDate);
        }

        List<Map<String, Object>> telecom = new ArrayList<>();
        if (email != null) {
            telecom.add(Map.of("system", "email", "value", email));
        }
        if (phone != null) {
            telecom.add(Map.of("system", "phone", "value", phone));
        }
        if (!telecom.isEmpty()) {
            patientResource.put("telecom", telecom);
        }

        if (address != null) {
            patientResource.put("address", List.of(Map.of("text", address)));
        }

        return patientResource;
    }

    private String normalizeGender(String gender) {
        if (gender == null || gender.isBlank()) {
            return null;
        }
        String normalized = gender.trim().toLowerCase();
        return switch (normalized) {
            case "male", "m" -> "male";
            case "female", "f" -> "female";
            case "other" -> "other";
            default -> "unknown";
        };
    }

    private String getString(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        return value == null ? null : String.valueOf(value);
    }

    private void recordSyncHistory(String patientId, String resourceType, String status,
            LocalDateTime startedAt, LocalDateTime completedAt, String message) {
        FhirSyncHistory history = new FhirSyncHistory();
        history.setPatientId(patientId);
        history.setResourceType(resourceType);
        history.setStatus(status);
        history.setStartedAt(startedAt);
        history.setCompletedAt(completedAt);
        history.setMessage(message);
        historyRepository.save(history);
    }
}
