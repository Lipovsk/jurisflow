package com.jurisflow.jurisflow.repository;

import com.jurisflow.jurisflow.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
}
