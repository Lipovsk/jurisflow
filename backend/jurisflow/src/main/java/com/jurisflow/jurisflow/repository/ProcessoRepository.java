package com.jurisflow.jurisflow.repository;

import com.jurisflow.jurisflow.model.Processo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProcessoRepository extends JpaRepository<Processo, Long> {

    @Query("select p from Processo p where p.ativo = true or p.ativo is null")
    List<Processo> findAllAtivos();

    @Query("select p from Processo p where p.id = :id and (p.ativo = true or p.ativo is null)")
    Optional<Processo> findAtivoById(@Param("id") Long id);

    @Query("select p from Processo p where p.cliente.id = :clienteId and (p.ativo = true or p.ativo is null)")
    List<Processo> findAtivosByClienteId(@Param("clienteId") Long clienteId);
}
