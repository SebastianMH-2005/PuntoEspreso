package com.puntoespresso.puntoespresso.repository;

import com.puntoespresso.puntoespresso.entity.Direccion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DireccionRepository extends JpaRepository<Direccion, Integer> {
}