package com.infosys.Medisphere.App.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "patients")
public class Patient {

    @Id
    private String id;

    private String patientId;

    private String firstName;

    private String lastName;

    private String gender;

    private LocalDate dob;

    private String email;

    private String phone;

    private String address;

    // Assignment & Healthcare Provider Fields (Optional)
    private String hospitalId;

    private String hospitalName;

    private String assignedDoctorId;

    private String assignedDoctorName;

    private String specialty;

    private String department;

    private String condition;

    private LocalDateTime createdAt;
}