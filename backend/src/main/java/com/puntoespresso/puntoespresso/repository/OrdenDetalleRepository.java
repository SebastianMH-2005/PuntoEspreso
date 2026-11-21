package com.puntoespresso.puntoespresso.repository;

import com.puntoespresso.puntoespresso.dto.OrdenDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface OrdenDetalleRepository extends JpaRepository<OrdenDetalle, Integer> {
       List<OrdenDetalle> findByOrden_IdOrden(Integer idOrden);

    // Los detalles de varias órdenes en una sola consulta (evita una consulta por orden)
    @Query("SELECT d FROM OrdenDetalle d JOIN FETCH d.producto WHERE d.orden.idOrden IN :ids")
    List<OrdenDetalle> buscarPorOrdenes(@Param("ids") Collection<Integer> ids);

    @Query("SELECT d FROM OrdenDetalle d JOIN FETCH d.producto "
            + "WHERE d.orden.fechaCreacion >= :desde AND d.orden.estado <> 'CANCELADO'")
    List<OrdenDetalle> buscarVigentesDesde(@Param("desde") LocalDateTime desde);
}