package com.puntoespresso.puntoespresso.repository;

import com.puntoespresso.puntoespresso.dto.OrdenDetalle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrdenDetalleRepository extends JpaRepository<OrdenDetalle, Integer> {
    List<OrdenDetalle> findByOrden_IdOrden(Integer idOrden);
}