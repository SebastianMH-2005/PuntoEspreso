package com.puntoespresso.puntoespresso.repository;

import com.puntoespresso.puntoespresso.dto.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Integer> {
}
