package com.infosys.fhir_service.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.infosys.fhir_service.dto.AllergyIntoleranceDTO;
import com.infosys.fhir_service.dto.ConditionDTO;
import com.infosys.fhir_service.dto.FhirPatientDTO;
import com.infosys.fhir_service.dto.MedicationDTO;
import com.infosys.fhir_service.dto.ProcedureDTO;
import com.infosys.fhir_service.dto.SyncResponseDTO;
import com.infosys.fhir_service.dto.ObservationDTO;
import com.infosys.fhir_service.model.FhirPatient;
import com.infosys.fhir_service.model.FhirSyncHistory;
import com.infosys.fhir_service.service.FhirService;

@RestController
@RequestMapping("/api/fhir")
public class FhirController {

    @Autowired
    private FhirService service;

    // Connect

    @PostMapping("/connect")
    public String connect() {
        return service.connect();
    }

    // Import Patient

    @PostMapping("/importPatient")
    public String importPatient(@RequestBody FhirPatient patient) {
        return service.importPatient(patient);
    }

    // Validate

    @PostMapping("/validate")
    public String validate(@RequestBody FhirPatient patient) {
        return service.validate(patient);
    }

    // Get All Resources

    @GetMapping("/resources")
    public List<FhirPatient> getResources() {
        return service.getResources();
    }

    // Get Patient Resources (legacy)

    @GetMapping("/{patientId}")
    public List<FhirPatient> getPatientResources(@PathVariable String patientId) {
        return service.getPatientResources(patientId);
    }

    // Get FHIR Patient by ID or identifier

    @GetMapping("/patient/{id}")
    public FhirPatientDTO getPatient(@PathVariable String id) {
        return service.getPatientById(id);
    }

    // Get Observations for patient

    @GetMapping("/observation/{patientId}")
    public List<ObservationDTO> getObservations(@PathVariable String patientId) {
        return service.getObservations(patientId);
    }

    // Get MedicationRequests for patient

    @GetMapping("/medication/{patientId}")
    public List<MedicationDTO> getMedications(@PathVariable String patientId) {
        return service.getMedications(patientId);
    }

    // Get Conditions for patient

    @GetMapping("/condition/{patientId}")
    public List<ConditionDTO> getConditions(@PathVariable String patientId) {
        return service.getConditions(patientId);
    }

    // Get Procedures for patient

    @GetMapping("/procedure/{patientId}")
    public List<ProcedureDTO> getProcedures(@PathVariable String patientId) {
        return service.getProcedures(patientId);
    }

    // Get AllergyIntolerances for patient

    @GetMapping("/allergy/{patientId}")
    public List<AllergyIntoleranceDTO> getAllergies(@PathVariable String patientId) {
        return service.getAllergies(patientId);
    }

    // Sync patient from FHIR server

    @PostMapping("/sync/{patientId}")
    public SyncResponseDTO syncPatient(@PathVariable String patientId) {
        return service.syncPatient(patientId);
    }

    // Get sync history events

    @GetMapping("/sync-history")
    public List<FhirSyncHistory> getSyncHistory(@RequestParam(required = false) String patientId) {
        return service.getSyncHistory(patientId);
    }
}
