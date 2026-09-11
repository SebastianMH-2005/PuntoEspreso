package com.puntoespresso.puntoespresso.repository;

import com.puntoespresso.puntoespresso.dto.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductoRepository extends JpaRepository<Producto, Integer> {
}
