package com.puntoespresso.puntoespresso.pedido;

import com.puntoespresso.puntoespresso.admin.DetalleResponse;
import com.puntoespresso.puntoespresso.auth.UsuarioAutenticado;
import com.puntoespresso.puntoespresso.dto.Cliente;
import com.puntoespresso.puntoespresso.dto.Orden;
import com.puntoespresso.puntoespresso.dto.OrdenDetalle;
import com.puntoespresso.puntoespresso.dto.Producto;
import com.puntoespresso.puntoespresso.dto.Rol;
import com.puntoespresso.puntoespresso.dto.Sede;
import com.puntoespresso.puntoespresso.exception.RecursoNoEncontradoException;
import com.puntoespresso.puntoespresso.repository.ClienteRepository;
import com.puntoespresso.puntoespresso.repository.OrdenDetalleRepository;
import com.puntoespresso.puntoespresso.repository.OrdenRepository;
import com.puntoespresso.puntoespresso.service.ProductoService;
import com.puntoespresso.puntoespresso.service.SedeService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

@Service
public class PedidoService {

    private final ProductoService productoService;
    private final ClienteRepository clienteRepository;
    private final OrdenRepository ordenRepository;
    private final OrdenDetalleRepository ordenDetalleRepository;
    private final SedeService sedeService;

    public PedidoService(ProductoService productoService, ClienteRepository clienteRepository,
            OrdenRepository ordenRepository, OrdenDetalleRepository ordenDetalleRepository,
            SedeService sedeService) {
        this.productoService = productoService;
        this.clienteRepository = clienteRepository;
        this.ordenRepository = ordenRepository;
        this.ordenDetalleRepository = ordenDetalleRepository;
        this.sedeService = sedeService;
    }

    private static String unirInstrucciones(String a, String b) {
        if (a == null || a.isBlank())
            return b;
        if (b == null || b.isBlank())
            return a;
        String unidas = a + " | " + b;
        return unidas.length() > 200 ? unidas.substring(0, 200) : unidas;
    }

    @Transactional
    public PedidoResponse crear(PedidoRequest request, UsuarioAutenticado usuario) {
        if (usuario.getRol() != Rol.CLIENTE) {
            throw new RolNoPermitidoException("Solo los clientes pueden generar pedidos");
        }

        Cliente cliente = clienteRepository.findByEmail(usuario.getUsername())
                .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado"));

        Sede sede = sedeService.buscarPorId(request.idSede())
                .orElseThrow(() -> new RecursoNoEncontradoException("La sede elegida no existe"));

        // Une líneas repetidas del mismo producto y las ordena por id (evita bloqueos
        // cruzados entre pedidos simultáneos)
        Map<Integer, ItemPedidoRequest> lineas = new TreeMap<>();
        for (ItemPedidoRequest item : request.items()) {
            lineas.merge(item.idProducto(), item, (a, b) -> new ItemPedidoRequest(
                    a.idProducto(), a.cantidad() + b.cantidad(),
                    unirInstrucciones(a.instrucciones(), b.instrucciones())));
        }

        String codigoUnico = "PE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Orden orden = new Orden(cliente, null, sede, "RECOJO", request.metodoPago(), "PENDIENTE", codigoUnico, 0);
        ordenRepository.save(orden);

        double total = 0;
        List<DetalleResponse> detalles = new ArrayList<>();
        for (ItemPedidoRequest linea : lineas.values()) {
            Producto producto = productoService.buscarPorId(linea.idProducto())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado"));

            // Si algún producto no alcanza, se revierte todo el pedido (incluido el stock
            // ya descontado)
            if (!productoService.descontarStock(producto.getIdProducto(), linea.cantidad())) {
                throw new StockInsuficienteException("No hay suficiente stock de «" + producto.getNombre() + "»");
            }

            ordenDetalleRepository.save(new OrdenDetalle(
                    orden, producto, linea.cantidad(), producto.getPrecio(), linea.instrucciones()));
            total += producto.getPrecio() * linea.cantidad();
            detalles.add(new DetalleResponse(producto.getNombre(), linea.cantidad(), producto.getPrecio()));
        }

        total = Math.round(total * 100.0) / 100.0;
        orden.setTotal(total);
        ordenRepository.save(orden);

        return new PedidoResponse(codigoUnico, total, sede.getNombre(), detalles);
    }
}