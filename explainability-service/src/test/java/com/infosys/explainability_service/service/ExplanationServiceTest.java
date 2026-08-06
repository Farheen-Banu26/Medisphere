package com.infosys.explainability_service.service;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.infosys.explainability_service.dto.ExplanationResponse;
import com.infosys.explainability_service.entity.ExplanationEntity;
import com.infosys.explainability_service.repository.ExplanationRepository;

@ExtendWith(MockitoExtension.class)
class ExplanationServiceTest {

    @Mock
    private ExplanationRepository repository;

    @InjectMocks
    private ExplanationService explanationService;

    @Test
    void getExplanationReturnsStoredResponse() {
        ExplanationEntity entity = new ExplanationEntity();
        entity.setRisk("HIGH");
        entity.setFactors(java.util.List.of("Blood Pressure +20"));

        when(repository.findByPatientId("P1001")).thenReturn(Optional.of(entity));

        ExplanationResponse response = explanationService.getExplanation("P1001");

        assertEquals("HIGH", response.getRisk());
        assertEquals(1, response.getFactors().size());
    }
}
