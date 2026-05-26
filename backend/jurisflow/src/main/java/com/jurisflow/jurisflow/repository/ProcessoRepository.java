package com.jurisflow.jurisflow.repository;

import com.jurisflow.jurisflow.model.Processo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProcessoRepository extends JpaRepository<Processo, Long> {

    List<Processo> findByClienteId(Long clienteId);
}