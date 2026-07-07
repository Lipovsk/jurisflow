package com.jurisflow.jurisflow.repository;

import com.jurisflow.jurisflow.model.RecebimentoHonorario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface RecebimentoHonorarioRepository extends JpaRepository<RecebimentoHonorario, Long> {

    List<RecebimentoHonorario> findAllByOrderByDataRecebimentoDescIdDesc();

    List<RecebimentoHonorario> findByHonorarioIdOrderByDataRecebimentoDescIdDesc(Long honorarioId);

    @Query("""
            select coalesce(sum(r.valorRecebido), 0)
            from RecebimentoHonorario r
            where r.honorario.id = :honorarioId
              and r.status = com.jurisflow.jurisflow.model.RecebimentoHonorario.STATUS_CONFIRMADO
            """)
    BigDecimal somarConfirmadosPorHonorario(@Param("honorarioId") Long honorarioId);
}
