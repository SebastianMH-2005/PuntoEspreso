package com.puntoespresso.puntoespresso.admin;

import com.puntoespresso.puntoespresso.auth.UsuarioAutenticado;
import com.puntoespresso.puntoespresso.dto.Orden;
import com.puntoespresso.puntoespresso.dto.OrdenDetalle;
import com.puntoespresso.puntoespresso.dto.UsuarioSistema;
import com.puntoespresso.puntoespresso.exception.RecursoNoEncontradoException;
import com.puntoespresso.puntoespresso.repository.OrdenDetalleRepository;
import com.puntoespresso.puntoespresso.repository.OrdenRepository;
import com.puntoespresso.puntoespresso.repository.UsuarioSistemaRepository;
import com.puntoespresso.puntoespresso.service.OrdenService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/admin/ordenes")
public class AdminOrdenController {

    private final OrdenRepository ordenRepository;
    private final OrdenDetalleRepository ordenDetalleRepository;
    private final UsuarioSistemaRepository usuarioSistemaRepository;
    private final OrdenService ordenService;

    public AdminOrdenController(OrdenRepository ordenRepository, OrdenDetalleRepository ordenDetalleRepository,
                                 UsuarioSistemaRepository usuarioSistemaRepository, OrdenService ordenService) {
        this.ordenRepository = ordenRepository;
        this.ordenDetalleRepository = ordenDetalleRepository;
        this.usuarioSistemaRepository = usuarioSistemaRepository;
        this.ordenService = ordenService;
    }

    @GetMapping
    public List<OrdenAdminResponse> listar(@RequestParam(required = false) String estado) {
        List<Orden> ordenes = (estado != null && !estado.isBlank())
                ? ordenRepository.buscarPorEstado(estado)
                : ordenRepository.listarRecientes();

        return ordenes.stream()
                .map(this::aRespuesta)
                .toList();
    }
    @PutMapping("/{id}/estado")
    public OrdenAdminResponse actualizarEstado(@PathVariable int id, @Valid @RequestBody EstadoRequest request,
                                                @AuthenticationPrincipal UsuarioAutenticado usuario) {
        UsuarioSistema staff = usuarioSistemaRepository.findByEmail(usuario.getUsername())
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario del sistema no encontrado"));

        return aRespuesta(ordenService.cambiarEstado(id, request.estado(), staff));
    }

    private OrdenAdminResponse aRespuesta(Orden orden) {
        List<OrdenDetalle> detalles = ordenDetalleRepository.findByOrden_IdOrden(orden.getIdOrden());

        List<DetalleResponse> items = detalles.stream()
                .map(d -> new DetalleResponse(d.getProducto().getNombre(), d.getCantidad(), d.getPrecioUnitario()))
                .toList();

        return new OrdenAdminResponse(
                orden.getIdOrden(),
                orden.getCliente() != null ? orden.getCliente().getNombre() : "—",
                orden.getCliente() != null ? orden.getCliente().getEmail() : "—",
                orden.getTipoEntrega(),
                orden.getMetodoPago(),
                orden.getEstado(),
                orden.getCodigoUnico(),
                orden.getTotal(),
                orden.getFechaCreacion(),
                orden.getSede() != null ? orden.getSede().getNombre() : null,
                items
        );
    }
}