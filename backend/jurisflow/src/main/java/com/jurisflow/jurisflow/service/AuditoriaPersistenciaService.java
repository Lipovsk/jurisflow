package com.jurisflow.jurisflow.service;

import com.jurisflow.jurisflow.model.Auditoria;
import com.jurisflow.jurisflow.repository.AuditoriaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditoriaPersistenciaService {

    private final AuditoriaRepository auditoriaRepository;

    public AuditoriaPersistenciaService(AuditoriaRepository auditoriaRepository) {
        this.auditoriaRepository = auditoriaRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void salvar(Auditoria auditoria) {
        auditoriaRepository.saveAndFlush(auditoria);
    }
}
