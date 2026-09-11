package com.puntoespresso.puntoespresso.repository;

import com.puntoespresso.puntoespresso.dto.Orden;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrdenRepository extends JpaRepository<Orden, Integer> {
}
