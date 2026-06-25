package com.jurisflow.jurisflow.repository;

import com.jurisflow.jurisflow.model.Honorario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HonorarioRepository extends JpaRepository<Honorario, Long> {

    List<Honorario> findByClienteId(Long clienteId);

    List<Honorario> findByProcessoId(Long processoId);

    Optional<Honorario> findByChaveIntegracao(String chaveIntegracao);
}
