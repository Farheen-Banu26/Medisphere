package com.infosys.Medisphere.App.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.infosys.Medisphere.App.model.Patient;
import com.infosys.Medisphere.App.service.PatientService;

//@CrossOrigin(origins = {
    //"http://localhost:5173",
    //"http://localhost:5174"
//})
@RestController
@RequestMapping("/api/patients")
public class PatientController {

    @Autowired
    private PatientService patientService;

    // Register Patient
    @PostMapping
    public String registerPatient(@RequestBody Patient patient) {
        return patientService.registerPatient(patient);
    }

    // Get All Patients
    @GetMapping
    public List<Patient> getAllPatients() {
        return patientService.getAllPatients();
    }

    // Get Patient By Patient ID
    @GetMapping("/{patientId}")
    public Patient getPatientById(@PathVariable String patientId) {
        return patientService.getPatientById(patientId);
    }

    // Update Patient
    @PutMapping("/{patientId}")
    public String updatePatient(@PathVariable String patientId,
                                @RequestBody Patient patient) {
        return patientService.updatePatient(patientId, patient);
    }

    // Delete Patient
    @DeleteMapping("/{id}")
    public String deletePatient(@PathVariable String id) {
        return patientService.deletePatient(id);
    }
}