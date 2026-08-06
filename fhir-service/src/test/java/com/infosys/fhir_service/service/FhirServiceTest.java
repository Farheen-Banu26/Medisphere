package com.infosys.fhir_service.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.infosys.fhir_service.client.FhirClient;
import com.infosys.fhir_service.client.PatientClient;
import com.infosys.fhir_service.dto.FhirPatientDTO;
import com.infosys.fhir_service.model.FhirPatient;
import com.infosys.fhir_service.model.FhirSyncHistory;
import com.infosys.fhir_service.repository.FhirRepository;
import com.infosys.fhir_service.repository.FhirSyncHistoryRepository;

@ExtendWith(MockitoExtension.class)
class FhirServiceTest {

    @Mock
    private FhirRepository repository;

    @Mock
    private FhirSyncHistoryRepository historyRepository;

    @Mock
    private FhirClient fhirClient;

    @Mock
    private PatientClient patientClient;

    @InjectMocks
    private FhirService service;

    @Test
    void shouldReturnPatientDtoWhenPatientExists() {
        FhirPatientDTO dto = new FhirPatientDTO();
        dto.setId("1001");
        dto.setFamilyName("Doe");
        dto.setGivenNames(List.of("John"));

        when(fhirClient.getPatient("1001")).thenReturn(dto);

        FhirPatientDTO result = service.getPatientById("1001");

        assertNotNull(result);
        assertEquals("Doe", result.getFamilyName());
    }

    @Test
    void shouldSaveSyncedResources() {
        FhirPatientDTO patientDto = new FhirPatientDTO();
        patientDto.setId("1001");
        patientDto.setFamilyName("Doe");
        patientDto.setGivenNames(List.of("John"));

        when(patientClient.getPatient("1001")).thenReturn(java.util.Map.of(
                "patientId", "1001",
                "firstName", "John",
                "lastName", "Doe",
                "gender", "male",
                "dob", "1990-01-01"));
        when(fhirClient.createPatient(any())).thenReturn(java.util.Map.of("resourceType", "Patient", "id", "1001"));
        when(fhirClient.getObservationsByFhirId("1001")).thenReturn(List.of());
        when(fhirClient.getMedicationsByFhirId("1001")).thenReturn(List.of());
        when(fhirClient.getConditionsByFhirId("1001")).thenReturn(List.of());
        when(fhirClient.getProceduresByFhirId("1001")).thenReturn(List.of());
        when(fhirClient.getAllergiesByFhirId("1001")).thenReturn(List.of());
        when(repository.save(any(FhirPatient.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(historyRepository.save(any(FhirSyncHistory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.syncPatient("1001");

        assertNotNull(response);
        assertEquals("1001", response.getPatientId());
        assertEquals(List.of("Patient", "Observation", "MedicationRequest", "Condition", "Procedure", "AllergyIntolerance"), response.getResources());
    }
}
