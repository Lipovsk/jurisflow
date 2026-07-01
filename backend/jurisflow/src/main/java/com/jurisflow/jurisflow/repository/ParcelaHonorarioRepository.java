package com.jurisflow.jurisflow.repository;

import com.jurisflow.jurisflow.model.ParcelaHonorario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ParcelaHonorarioRepository extends JpaRepository<ParcelaHonorario, Long> {

    List<ParcelaHonorario> findByHonorarioIdOrderByNumeroParcelaAsc(Long honorarioId);
}
