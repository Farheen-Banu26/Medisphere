package com.medisphere.careplan_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * Care Plan Service — Milestone 4 Phase 1
 *
 * Manages patient care plans including generation, doctor approval,
 * patient progress tracking, and history.
 *
 * Registers with Eureka for service discovery.
 * MongoDB database: careplandb (auto-created on first document insert).
 */
@SpringBootApplication
@EnableDiscoveryClient
public class CareplanServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CareplanServiceApplication.class, args);
    }
}
