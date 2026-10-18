package com.puntoespresso.puntoespresso.repository;

import com.puntoespresso.puntoespresso.dto.Orden;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface OrdenRepository extends JpaRepository<Orden, Integer> {

    @Query("SELECT o FROM Orden o WHERE o.estado = :estado ORDER BY o.fechaCreacion DESC NULLS LAST")
    List<Orden> buscarPorEstado(@Param("estado") String estado);

    @Query("SELECT o FROM Orden o ORDER BY o.fechaCreacion DESC NULLS LAST")
    List<Orden> listarRecientes();

    List<Orden> findByCliente_IdClienteOrderByFechaCreacionDesc(Integer idCliente);

    Optional<Orden> findByIdOrdenAndCliente_IdCliente(Integer idOrden, Integer idCliente);
}