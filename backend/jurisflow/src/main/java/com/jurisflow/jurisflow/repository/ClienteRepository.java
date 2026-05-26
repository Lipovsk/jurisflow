package com.jurisflow.jurisflow.controller;

import com.jurisflow.jurisflow.model.Cliente;
import com.jurisflow.jurisflow.repository.ClienteRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
}