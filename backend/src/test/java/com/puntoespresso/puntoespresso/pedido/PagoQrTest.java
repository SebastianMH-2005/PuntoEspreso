package com.puntoespresso.puntoespresso.pedido;

import com.puntoespresso.puntoespresso.auth.UsuarioAutenticado;
import com.puntoespresso.puntoespresso.dto.Cliente;
import com.puntoespresso.puntoespresso.dto.Orden;
import com.puntoespresso.puntoespresso.dto.Rol;
import com.puntoespresso.puntoespresso.exception.ConflictoException;
import com.puntoespresso.puntoespresso.exception.SolicitudInvalidaException;
import com.puntoespresso.puntoespresso.repository.ClienteRepository;
import com.puntoespresso.puntoespresso.repository.OrdenRepository;
import com.puntoespresso.puntoespresso.repository.ProductoRepository;
import com.puntoespresso.puntoespresso.repository.SedeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class PagoQrTest {

    @Autowired
    PedidoService pedidoService;
    @Autowired
    ClienteRepository clienteRepository;
    @Autowired
    OrdenRepository ordenRepository;
    @Autowired
    ProductoRepository productoRepository;
    @Autowired
    SedeRepository sedeRepository;

    private UsuarioAutenticado usuario;
    private int idCliente;
    private int idSede;
    private int idProducto;

    @BeforeEach
    void preparar() {
        Cliente c = clienteRepository.save(
                new Cliente("Cliente QR", "55556666", "cliente.qr@test.pe", "hash", "955555555"));
        idCliente = c.getIdCliente();
        usuario = new UsuarioAutenticado(c.getIdCliente(), c.getNombre(), c.getEmail(), "hash", Rol.CLIENTE);
        idSede = sedeRepository.findAll().get(0).getIdSede();
        idProducto = productoRepository.findAll().stream()
                .filter(p -> "Café Americano".equals(p.getNombre()))
                .findFirst().orElseThrow().getIdProducto();
    }

    private PedidoRequest pedido(String metodoPago, String codigoOperacion) {
        return new PedidoRequest(
                List.of(new ItemPedidoRequest(idProducto, 1, null)), idSede, metodoPago, codigoOperacion);
    }

    private Orden ultimaOrden() {
        return ordenRepository.findByCliente_IdClienteOrderByFechaCreacionDesc(idCliente).get(0);
    }

    @Test
    void unPagoConYapeGuardaElNumeroDeOperacion() {
        pedidoService.crear(pedido("YAPE", " 12345678 "), usuario);

        Orden orden = ultimaOrden();
        assertThat(orden.getMetodoPago()).isEqualTo("YAPE");
        assertThat(orden.getCodigoOperacion()).isEqualTo("12345678");
        assertThat(orden.getEstado()).isEqualTo("PENDIENTE");
    }

    @Test
    void unPagoConQrSinNumeroDeOperacionSeRechaza() {
        assertThatThrownBy(() -> pedidoService.crear(pedido("YAPE", null), usuario))
                .isInstanceOf(SolicitudInvalidaException.class);
        assertThatThrownBy(() -> pedidoService.crear(pedido("PLIN", "  "), usuario))
                .isInstanceOf(SolicitudInvalidaException.class);
    }

    @Test
    void elMismoNumeroDeOperacionNoSirveParaDosPedidos() {
        pedidoService.crear(pedido("YAPE", "87654321"), usuario);

        assertThatThrownBy(() -> pedidoService.crear(pedido("YAPE", "87654321"), usuario))
                .isInstanceOf(ConflictoException.class)
                .hasMessageContaining("ya fue usado");
    }

    @Test
    void unPagoConTarjetaNoGuardaNumeroDeOperacion() {
        pedidoService.crear(pedido("CC", "99999999"), usuario);

        assertThat(ultimaOrden().getCodigoOperacion()).isNull();
    }
}