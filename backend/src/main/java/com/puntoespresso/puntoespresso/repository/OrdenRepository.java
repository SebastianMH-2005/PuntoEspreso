package com.puntoespresso.puntoespresso.repository;

import com.puntoespresso.puntoespresso.dto.Orden;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrdenRepository extends JpaRepository<Orden, Integer> {

    @Query("SELECT o FROM Orden o WHERE o.estado = :estado ORDER BY o.fechaCreacion DESC NULLS LAST")
    List<Orden> buscarPorEstado(@Param("estado") String estado);

    @Query("SELECT o FROM Orden o WHERE o.fechaCreacion >= :desde")
    List<Orden> buscarDesde(@Param("desde") LocalDateTime desde);

    long countByEstado(String estado);

    boolean existsByCodigoOperacion(String codigoOperacion);

    String FILTRO_ORDENES = "WHERE (:estado = '' OR o.estado = :estado) "
            + "AND (:q = '' OR LOCATE(:q, LOWER(o.codigoUnico)) > 0 "
            + "OR LOCATE(:q, LOWER(c.nombre)) > 0 OR LOCATE(:q, LOWER(c.email)) > 0)";

    // Una página del panel: más recientes primero. estado y q llegan siempre (vacíos = sin filtro);
    // q ya viene en minúsculas. Busca por código de la orden, nombre o email del cliente.
    @EntityGraph(attributePaths = { "cliente", "sede" })
    @Query(value = "SELECT o FROM Orden o LEFT JOIN o.cliente c " + FILTRO_ORDENES
            + " ORDER BY o.fechaCreacion DESC NULLS LAST, o.idOrden DESC",
            countQuery = "SELECT COUNT(o) FROM Orden o LEFT JOIN o.cliente c " + FILTRO_ORDENES)
    Page<Orden> buscarPagina(@Param("estado") String estado, @Param("q") String q, Pageable pageable);

    @Query("SELECT o FROM Orden o ORDER BY o.fechaCreacion DESC NULLS LAST")
    List<Orden> listarRecientes();

    List<Orden> findByCliente_IdClienteOrderByFechaCreacionDesc(Integer idCliente);

    Optional<Orden> findByIdOrdenAndCliente_IdCliente(Integer idOrden, Integer idCliente);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Orden o WHERE o.idOrden = :id")
    Optional<Orden> buscarParaActualizar(@Param("id") Integer id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Orden o WHERE o.idOrden = :id AND o.cliente.idCliente = :idCliente")
    Optional<Orden> buscarDelClienteParaActualizar(@Param("id") Integer id, @Param("idCliente") Integer idCliente);
}