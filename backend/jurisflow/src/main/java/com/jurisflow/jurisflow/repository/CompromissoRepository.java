package com.jurisflow.jurisflow.repository;

import com.jurisflow.jurisflow.model.Compromisso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CompromissoRepository extends JpaRepository<Compromisso, Long> {

    List<Compromisso> findByClienteId(Long clienteId);

    List<Compromisso> findByProcessoId(Long processoId);

    Optional<Compromisso> findByChaveIntegracao(String chaveIntegracao);
}
