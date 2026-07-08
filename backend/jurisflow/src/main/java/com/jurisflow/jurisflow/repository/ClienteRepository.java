package com.jurisflow.jurisflow.repository;

import com.jurisflow.jurisflow.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    @Query("select c from Cliente c where c.ativo = true or c.ativo is null")
    List<Cliente> findAllAtivos();

    @Query("select c from Cliente c where c.id = :id and (c.ativo = true or c.ativo is null)")
    Optional<Cliente> findAtivoById(@Param("id") Long id);
}
