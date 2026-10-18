package com.puntoespresso.puntoespresso.service;

import com.puntoespresso.puntoespresso.admin.DetalleResponse;
import com.puntoespresso.puntoespresso.auth.UsuarioAutenticado;
import com.puntoespresso.puntoespresso.dto.Orden;
import com.puntoespresso.puntoespresso.dto.OrdenDetalle;
import com.puntoespresso.puntoespresso.dto.UsuarioSistema;
import com.puntoespresso.puntoespresso.exception.ConflictoException;
import com.puntoespresso.puntoespresso.exception.RecursoNoEncontradoException;
import com.puntoespresso.puntoespresso.pedido.MiOrdenResponse;
import com.puntoespresso.puntoespresso.repository.OrdenDetalleRepository;
import com.puntoespresso.puntoespresso.repository.OrdenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrdenService {

    private static final String PENDIENTE = "PENDIENTE";
    private static final String CANCELADO = "CANCELADO";
    private static final String ENTREGADO = "ENTREGADO";

    private final OrdenRepository ordenRepository;
    private final OrdenDetalleRepository ordenDetalleRepository;
    private final ProductoService productoService;

    public OrdenService(OrdenRepository ordenRepository, OrdenDetalleRepository ordenDetalleRepository,
                        ProductoService productoService) {
        this.ordenRepository = ordenRepository;
        this.ordenDetalleRepository = ordenDetalleRepository;
        this.productoService = productoService;
    }

    // Los métodos "DelCliente" solo se alcanzan con rol CLIENTE (lo exige SecurityConfig en /api/pedidos/**),
    // por eso usuario.getId() es siempre un id de la tabla clientes.

    @Transactional(readOnly = true)
    public List<MiOrdenResponse> listarDelCliente(UsuarioAutenticado usuario) {
        return ordenRepository.findByCliente_IdClienteOrderByFechaCreacionDesc(usuario.getId()).stream()
                .map(this::aMiOrden)
                .toList();
    }

    @Transactional(readOnly = true)
    public MiOrdenResponse obtenerDelCliente(int idOrden, UsuarioAutenticado usuario) {
        return aMiOrden(buscarDelCliente(idOrden, usuario));
    }

    @Transactional
    public MiOrdenResponse cancelarDelCliente(int idOrden, UsuarioAutenticado usuario) {
        Orden orden = buscarDelCliente(idOrden, usuario);
        if (!PENDIENTE.equals(orden.getEstado())) {
            throw new ConflictoException("Solo puedes cancelar pedidos que aún estén pendientes");
        }
        reponerStock(orden);
        orden.setEstado(CANCELADO);
        ordenRepository.save(orden);
        return aMiOrden(orden);
    }

    @Transactional
    public Orden cambiarEstado(int idOrden, String nuevoEstado, UsuarioSistema staff) {
        Orden orden = ordenRepository.findById(idOrden)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe una orden con id " + idOrden));

        String actual = orden.getEstado();
        if (ENTREGADO.equals(actual) || CANCELADO.equals(actual)) {
            throw new ConflictoException("La orden está en estado " + actual + " y ya no se puede modificar");
        }
        if (CANCELADO.equals(nuevoEstado)) {
            reponerStock(orden);
        }

        orden.setEstado(nuevoEstado);
        orden.setUsuarioSistema(staff);
        return ordenRepository.save(orden);
    }

    private Orden buscarDelCliente(int idOrden, UsuarioAutenticado usuario) {
        // Si la orden existe pero es de otro cliente, responde 404 igual (no revela que existe)
        return ordenRepository.findByIdOrdenAndCliente_IdCliente(idOrden, usuario.getId())
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un pedido con id " + idOrden));
    }

    private void reponerStock(Orden orden) {
        for (OrdenDetalle d : ordenDetalleRepository.findByOrden_IdOrden(orden.getIdOrden())) {
            productoService.reponerStock(d.getProducto().getIdProducto(), d.getCantidad());
        }
    }

    private MiOrdenResponse aMiOrden(Orden orden) {
        List<DetalleResponse> detalles = ordenDetalleRepository.findByOrden_IdOrden(orden.getIdOrden()).stream()
                .map(d -> new DetalleResponse(d.getProducto().getNombre(), d.getCantidad(), d.getPrecioUnitario()))
                .toList();

        return new MiOrdenResponse(orden.getIdOrden(), orden.getCodigoUnico(), orden.getEstado(),
                orden.getTipoEntrega(), orden.getMetodoPago(), orden.getTotal(), orden.getFechaCreacion(),
                orden.getSede() != null ? orden.getSede().getNombre() : null, detalles);
    }
}