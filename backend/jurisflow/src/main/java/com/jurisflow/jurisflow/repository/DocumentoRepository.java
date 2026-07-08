package com.jurisflow.jurisflow.repository;

import com.jurisflow.jurisflow.model.Documento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface DocumentoRepository extends JpaRepository<Documento, Long>, JpaSpecificationExecutor<Documento> {

    Optional<Documento> findByIdAndAtivoTrue(Long id);

    boolean existsByClienteIdAndAtivoTrue(Long clienteId);

    boolean existsByProcessoIdAndAtivoTrue(Long processoId);

    boolean existsByClienteId(Long clienteId);

    boolean existsByProcessoId(Long processoId);
}
