package com.puntoespresso.puntoespresso.pedido;

import com.puntoespresso.puntoespresso.auth.UsuarioAutenticado;
import com.puntoespresso.puntoespresso.dto.Cliente;
import com.puntoespresso.puntoespresso.dto.Orden;
import com.puntoespresso.puntoespresso.dto.OrdenDetalle;
import com.puntoespresso.puntoespresso.dto.Producto;
import com.puntoespresso.puntoespresso.exception.RecursoNoEncontradoException;
import com.puntoespresso.puntoespresso.repository.ClienteRepository;
import com.puntoespresso.puntoespresso.repository.OrdenDetalleRepository;
import com.puntoespresso.puntoespresso.repository.OrdenRepository;
import com.puntoespresso.puntoespresso.service.ProductoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final ProductoService productoService;
    private final ClienteRepository clienteRepository;
    private final OrdenRepository ordenRepository;
    private final OrdenDetalleRepository ordenDetalleRepository;

    public PedidoController(ProductoService productoService, ClienteRepository clienteRepository,
                             OrdenRepository ordenRepository, OrdenDetalleRepository ordenDetalleRepository) {
        this.productoService = productoService;
        this.clienteRepository = clienteRepository;
        this.ordenRepository = ordenRepository;
        this.ordenDetalleRepository = ordenDetalleRepository;
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody PedidoRequest request, @AuthenticationPrincipal UsuarioAutenticado usuario) {
        if (!"CLIENTE".equals(usuario.getRol())) {
            return ResponseEntity.status(403).body("Solo los clientes pueden generar pedidos");
        }

        Cliente cliente = clienteRepository.findByEmail(usuario.getUsername())
                .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado"));

        Producto producto = productoService.buscarPorId(request.idProducto())
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado"));

        if (producto.getStock() < request.cantidad()) {
            return ResponseEntity.status(409).body("No hay suficiente stock disponible");
        }

        double total = producto.getPrecio() * request.cantidad();
        String codigoUnico = "PE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Orden orden = new Orden(cliente, null, null, "RECOJO", request.metodoPago(), "PENDIENTE", codigoUnico, total);
        ordenRepository.save(orden);

        OrdenDetalle detalle = new OrdenDetalle(orden, producto, request.cantidad(), producto.getPrecio(), request.instrucciones());
        ordenDetalleRepository.save(detalle);

        producto.setStock(producto.getStock() - request.cantidad());
        productoService.guardar(producto);

        return ResponseEntity.ok(new PedidoResponse(codigoUnico, producto.getNombre(), request.cantidad(), total));
    }
}