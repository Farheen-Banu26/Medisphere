package com.infosys.vitals_service.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.infosys.vitals_service.model.Vital;
import com.infosys.vitals_service.service.VitalsService;

@RestController
@RequestMapping("/api/vitals")
public class VitalsController {

    @Autowired
    private VitalsService service;

    // Add Vitals
    @PostMapping
    public String addVitals(@RequestBody Vital vital) {

        return service.addVitals(vital);
    }

    // Get All
    @GetMapping
    public List<Vital> getAllVitals() {

        return service.getAllVitals();
    }

    // Get Patient Vitals
    @GetMapping("/{patientId}")
    public List<Vital> getVitals(@PathVariable String patientId) {

        return service.getVitalsByPatient(patientId);
    }

    // Get Latest
    @GetMapping("/latest/{patientId}")
    public Vital getLatest(@PathVariable String patientId) {

        return service.getLatestVitals(patientId);
    }

    // Delete
    @DeleteMapping("/{id}")
    public String deleteVitals(@PathVariable String id) {

        return service.deleteVitals(id);
    }

}