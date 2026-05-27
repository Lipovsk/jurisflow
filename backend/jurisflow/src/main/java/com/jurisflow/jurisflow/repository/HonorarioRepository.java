package com.jurisflow.jurisflow.repository;

import com.jurisflow.jurisflow.model.Honorario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HonorarioRepository extends JpaRepository<Honorario, Long> {

    List<Honorario> findByClienteId(Long clienteId);

    List<Honorario> findByProcessoId(Long processoId);
}