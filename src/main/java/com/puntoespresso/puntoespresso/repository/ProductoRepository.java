package com.puntoespresso.puntoespresso.repository;

import com.puntoespresso.puntoespresso.dto.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Integer> {

    @Query("SELECT p FROM Producto p WHERE p.categoria.idCategoria = :idCategoria")
    List<Producto> buscarPorCategoria(@Param("idCategoria") Integer idCategoria);
}