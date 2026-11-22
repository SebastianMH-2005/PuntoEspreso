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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/ordenes")
public class AdminOrdenController {

        private static final int TAMANO_MAXIMO = 50;

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

        // Una sola transacción de solo lectura: todas las consultas de la página comparten sesión
        @GetMapping
        @Transactional(readOnly = true)
        public PaginaOrdenesResponse listar(@RequestParam(required = false) String estado,
                        @RequestParam(required = false) String q,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {
                int tamano = Math.min(Math.max(size, 1), TAMANO_MAXIMO);
                Page<Orden> pagina = ordenRepository.buscarPagina(
                                estado == null ? "" : estado.trim(),
                                q == null ? "" : q.trim().toLowerCase(Locale.ROOT),
                                PageRequest.of(Math.max(page, 0), tamano));

                // Los detalles de toda la página en una sola consulta
                List<Integer> ids = pagina.getContent().stream().map(Orden::getIdOrden).toList();
                Map<Integer, List<OrdenDetalle>> detallesPorOrden = ids.isEmpty()
                                ? Map.of()
                                : ordenDetalleRepository.buscarPorOrdenes(ids).stream()
                                                .collect(Collectors.groupingBy(d -> d.getOrden().getIdOrden()));

                List<OrdenAdminResponse> contenido = pagina.getContent().stream()
                                .map(o -> aRespuesta(o, detallesPorOrden.getOrDefault(o.getIdOrden(), List.of())))
                                .toList();

                return new PaginaOrdenesResponse(contenido, pagina.getNumber(), pagina.getSize(),
                                pagina.getTotalElements(), pagina.getTotalPages(),
                                ordenRepository.countByEstado("PENDIENTE"));
        }

        @PutMapping("/{id}/estado")
        public OrdenAdminResponse actualizarEstado(@PathVariable int id, @Valid @RequestBody EstadoRequest request,
                        @AuthenticationPrincipal UsuarioAutenticado usuario) {
                UsuarioSistema staff = usuarioSistemaRepository.findByEmail(usuario.getUsername())
                                .orElseThrow(() -> new RecursoNoEncontradoException(
                                                "Usuario del sistema no encontrado"));

                return aRespuesta(ordenService.cambiarEstado(id, request.estado(), staff));
        }

                private OrdenAdminResponse aRespuesta(Orden orden) {
                return aRespuesta(orden, ordenDetalleRepository.findByOrden_IdOrden(orden.getIdOrden()));
        }

        private OrdenAdminResponse aRespuesta(Orden orden, List<OrdenDetalle> detalles) {
                

                List<DetalleResponse> items = detalles.stream()
                                .map(d -> new DetalleResponse(d.getProducto().getNombre(), d.getCantidad(),
                                                d.getPrecioUnitario()))
                                .toList();

                return new OrdenAdminResponse(
                                orden.getIdOrden(),
                                orden.getCliente() != null ? orden.getCliente().getNombre() : "—",
                                orden.getCliente() != null ? orden.getCliente().getEmail() : "—",
                                orden.getTipoEntrega(),
                                orden.getMetodoPago(),
                                orden.getCodigoOperacion(),
                                orden.getEstado(),
                                orden.getCodigoUnico(),
                                orden.getTotal(),
                                orden.getFechaCreacion(),
                                orden.getSede() != null ? orden.getSede().getNombre() : null,
                                items);
        }
}