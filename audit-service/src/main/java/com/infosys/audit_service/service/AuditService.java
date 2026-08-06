package com.infosys.audit_service.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.infosys.audit_service.model.AuditLog;
import com.infosys.audit_service.repository.AuditLogRepository;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository repository;

    public List<AuditLog> getLogs() {
        return repository.findAllByOrderByTimestampDesc();
    }

    public AuditLog saveLog(AuditLog log) {
        return repository.save(log);
    }
}
