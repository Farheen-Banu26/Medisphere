package com.infosys.health_twin_service.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.infosys.health_twin_service.dto.Patient360Response;
import com.infosys.health_twin_service.model.HealthTwin;
import com.infosys.health_twin_service.service.HealthTwinService;

@RestController
@RequestMapping("/api/twins")
public class HealthTwinController {

    @Autowired
    private HealthTwinService service;

    @PostMapping
    public String createTwin(@RequestBody HealthTwin twin) {
        if (twin != null && (twin.getPatientId() == null || twin.getPatientId().isBlank())) {
            twin.setPatientId(null);
        }
        return service.createTwin(twin);
    }

    @GetMapping("/{patientId}")
    public HealthTwin getTwin(@PathVariable String patientId, jakarta.servlet.http.HttpServletRequest request) {
        service.verifyPatientResourceAccess(patientId, request);
        return service.getTwin(patientId);
    }

    @PutMapping("/{patientId}")
    public String updateTwin(@PathVariable String patientId,
                             @RequestBody HealthTwin twin) {
        if (twin != null && (twin.getPatientId() == null || twin.getPatientId().isBlank())) {
            twin.setPatientId(patientId);
        }
        return service.updateTwin(patientId, twin);
    }

    @GetMapping("/test/{patientId}")
    public HealthTwin test(@PathVariable String patientId, jakarta.servlet.http.HttpServletRequest request) {
        service.verifyPatientResourceAccess(patientId, request);
        return service.getTwin(patientId);
    }

    @GetMapping("/{patientId}/health-score")
    public double calculateHealthScore(@PathVariable String patientId, jakarta.servlet.http.HttpServletRequest request) {
        service.verifyPatientResourceAccess(patientId, request);
        return service.calculateHealthScore(patientId);
    }

    @GetMapping("/summary/{patientId}")
    public Patient360Response getPatient360Summary(@PathVariable String patientId, jakarta.servlet.http.HttpServletRequest request) {
        service.verifyPatientResourceAccess(patientId, request);
        return service.getPatient360Summary(patientId);
    }

}