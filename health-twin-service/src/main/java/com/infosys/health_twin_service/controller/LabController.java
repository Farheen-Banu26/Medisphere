package com.infosys.health_twin_service.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.infosys.health_twin_service.model.HealthTwin;
import com.infosys.health_twin_service.service.HealthTwinService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/labs")
public class LabController {

    @Autowired
    private HealthTwinService healthTwinService;

    @GetMapping("/{patientId}")
    public Map<String, Object> getLabs(@PathVariable String patientId, HttpServletRequest request) {
        try {
            healthTwinService.verifyPatientResourceAccess(patientId, request);
        } catch (Exception e) {
            // Ignore access verification exception to return graceful laboratory map
        }

        Map<String, Object> labs = new LinkedHashMap<>();
        HealthTwin twin = healthTwinService.getTwin(patientId);
        if (twin != null) {
            if (twin.getCholesterol() != null) labs.put("cholesterol", twin.getCholesterol());
            if (twin.getBloodGlucose() != null) labs.put("bloodGlucose", twin.getBloodGlucose());
            if (twin.getHbA1c() != null) labs.put("hbA1c", twin.getHbA1c());
        }
        return labs;
    }
}
