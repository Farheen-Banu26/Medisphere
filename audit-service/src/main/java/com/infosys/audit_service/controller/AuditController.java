package com.infosys.audit_service.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.infosys.audit_service.model.AuditLog;
import com.infosys.audit_service.service.AuditService;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    @Autowired
    private AuditService service;

    @GetMapping("/logs")
    public List<AuditLog> getLogs(jakarta.servlet.http.HttpServletRequest request) {
        return service.getLogsSecured(request);
    }

    @PostMapping("/logs")
    public AuditLog createLog(@RequestBody AuditLog log) {
        return service.saveLog(log);
    }
}
