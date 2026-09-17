package com.puntoespresso.puntoespresso.repository;

import com.puntoespresso.puntoespresso.dto.Orden;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrdenRepository extends JpaRepository<Orden, Integer> {

    @Query("SELECT o FROM Orden o WHERE o.estado = :estado")
    List<Orden> buscarPorEstado(@Param("estado") String estado);
}