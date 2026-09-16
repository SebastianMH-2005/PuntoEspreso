package com.puntoespresso.puntoespresso.admin;

import com.puntoespresso.puntoespresso.auth.UsuarioAutenticado;
import com.puntoespresso.puntoespresso.dto.Orden;
import com.puntoespresso.puntoespresso.dto.OrdenDetalle;
import com.puntoespresso.puntoespresso.dto.UsuarioSistema;
import com.puntoespresso.puntoespresso.exception.RecursoNoEncontradoException;
import com.puntoespresso.puntoespresso.repository.OrdenDetalleRepository;
import com.puntoespresso.puntoespresso.repository.OrdenRepository;
import com.puntoespresso.puntoespresso.repository.UsuarioSistemaRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/ordenes")
public class AdminOrdenController {

    private final OrdenRepository ordenRepository;
    private final OrdenDetalleRepository ordenDetalleRepository;
    private final UsuarioSistemaRepository usuarioSistemaRepository;

    public AdminOrdenController(OrdenRepository ordenRepository, OrdenDetalleRepository ordenDetalleRepository,
                                 UsuarioSistemaRepository usuarioSistemaRepository) {
        this.ordenRepository = ordenRepository;
        this.ordenDetalleRepository = ordenDetalleRepository;
        this.usuarioSistemaRepository = usuarioSistemaRepository;
    }

    @GetMapping
    public List<OrdenAdminResponse> listar() {
        return ordenRepository.findAll().stream()
                .map(this::aRespuesta)
                .sorted((a, b) -> b.fechaCreacion().compareTo(a.fechaCreacion()))
                .toList();
    }

    @PutMapping("/{id}/estado")
    public OrdenAdminResponse actualizarEstado(@PathVariable int id, @RequestBody EstadoRequest request,
                                                @AuthenticationPrincipal UsuarioAutenticado usuario) {
        Orden orden = ordenRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe una orden con id " + id));

        UsuarioSistema staff = usuarioSistemaRepository.findByEmail(usuario.getUsername())
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario del sistema no encontrado"));

        orden.setEstado(request.estado());
        orden.setUsuarioSistema(staff);
        ordenRepository.save(orden);

        return aRespuesta(orden);
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
                items
        );
    }
}