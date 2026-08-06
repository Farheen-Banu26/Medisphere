package com.infosys.wearable_simulator.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.infosys.wearable_simulator.model.VitalMessage;
import com.infosys.wearable_simulator.scheduler.WearableScheduler;
import com.infosys.wearable_simulator.service.WearableService;

@RestController
@RequestMapping("/api/simulator")
public class SimulatorController {

    private final WearableScheduler scheduler;
    private final WearableService wearableService;

    public SimulatorController(WearableScheduler scheduler, WearableService wearableService) {
        this.scheduler = scheduler;
        this.wearableService = wearableService;
    }

    @PostMapping("/start")
    public ResponseEntity<String> start() {
        scheduler.start();
        return ResponseEntity.ok("RUNNING");
    }

    @PostMapping("/stop")
    public ResponseEntity<String> stop() {
        scheduler.stop();
        return ResponseEntity.ok("STOPPED");
    }

    @GetMapping("/status")
    public ResponseEntity<String> status() {
        return ResponseEntity.ok(scheduler.isRunning() ? "RUNNING" : "STOPPED");
    }

    @GetMapping("/send/{patientId}")
    public ResponseEntity<String> send(@PathVariable String patientId) {
        VitalMessage vitals = scheduler.generateVitals(patientId);
        boolean success = wearableService.sendVitals(vitals);
        return success ? ResponseEntity.ok("SENT") : ResponseEntity.status(503).body("FAILED");
    }
}
