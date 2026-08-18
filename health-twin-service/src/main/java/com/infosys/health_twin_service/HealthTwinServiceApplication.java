package com.infosys.health_twin_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class HealthTwinServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(HealthTwinServiceApplication.class, args);
	}

}
