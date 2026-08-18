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

    // Get All Patients (Secured)
    @GetMapping
    public List<Patient> getAllPatients(jakarta.servlet.http.HttpServletRequest request) {
        return patientService.getAllPatientsSecured(request);
    }

    // Get Patient By Patient ID (Secured)
    @GetMapping("/{patientId}")
    public Patient getPatientById(@PathVariable String patientId, jakarta.servlet.http.HttpServletRequest request) {
        return patientService.getPatientByIdSecured(patientId, request);
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

    // Seed Assignment Data (Idempotent)
    @PostMapping("/seed")
    public String seedPatients() {
        return patientService.seedPatients();
    }

    // Get Patients Assigned to Doctor (Secured)
    @GetMapping("/doctor/{doctorId}")
    public List<Patient> getPatientsByDoctor(@PathVariable String doctorId, jakarta.servlet.http.HttpServletRequest request) {
        return patientService.getPatientsByDoctorSecured(doctorId, request);
    }

    // Get Patients By Hospital
    @GetMapping("/hospital/{hospitalId}")
    public List<Patient> getPatientsByHospital(@PathVariable String hospitalId) {
        return patientService.getPatientsByHospital(hospitalId);
    }

    // Get Patients By Specialty
    @GetMapping("/specialty/{specialty}")
    public List<Patient> getPatientsBySpecialty(@PathVariable String specialty) {
        return patientService.getPatientsBySpecialty(specialty);
    }

    // Re-Assign Patient (Admin-Only Workflow)
    @PutMapping("/{patientId}/assign")
    public String assignPatient(@PathVariable String patientId,
                                @RequestBody Patient assignmentData,
                                jakarta.servlet.http.HttpServletRequest request) {
        return patientService.assignPatientSecured(patientId, assignmentData, request);
    }
}