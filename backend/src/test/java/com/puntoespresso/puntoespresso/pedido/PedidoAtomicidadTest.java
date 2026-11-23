package com.puntoespresso.puntoespresso.pedido;

import com.puntoespresso.puntoespresso.auth.UsuarioAutenticado;
import com.puntoespresso.puntoespresso.entity.Cliente;
import com.puntoespresso.puntoespresso.entity.Producto;
import com.puntoespresso.puntoespresso.entity.Rol;
import com.puntoespresso.puntoespresso.repository.ClienteRepository;
import com.puntoespresso.puntoespresso.repository.OrdenRepository;
import com.puntoespresso.puntoespresso.repository.ProductoRepository;
import com.puntoespresso.puntoespresso.repository.SedeRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// Sin @Transactional a propósito: aquí se prueba la transacción real de PedidoService.crear
@SpringBootTest
class PedidoAtomicidadTest {

    @Autowired
    PedidoService pedidoService;
    @Autowired
    ProductoRepository productoRepository;
    @Autowired
    ClienteRepository clienteRepository;
    @Autowired
    SedeRepository sedeRepository;
    @Autowired
    OrdenRepository ordenRepository;

    private Cliente cliente;

    @BeforeEach
    void crearCliente() {
        cliente = clienteRepository.save(
                new Cliente("Cliente Atomico", "87654321", "atomico@test.pe", "hash", "912345678"));
    }

    @AfterEach
    void limpiar() {
        clienteRepository.deleteById(cliente.getIdCliente());
    }

    private Producto producto(String nombre) {
        return productoRepository.findAll().stream()
                .filter(p -> nombre.equals(p.getNombre()))
                .findFirst().orElseThrow();
    }

    @Test
    void siUnProductoNoAlcanzaSeRevierteTodoElPedido() {
        // Los productos se procesan por id: el Frappé se descuenta primero y el Geisha falla después
        Producto frappe = producto("Frappé Mocha");
        Producto geisha = producto("Café Geisha Grano");
        int frappeAntes = frappe.getStock();
        int geishaAntes = geisha.getStock();

        UsuarioAutenticado usuario = new UsuarioAutenticado(
                cliente.getIdCliente(), cliente.getNombre(), cliente.getEmail(), "hash", Rol.CLIENTE);
        PedidoRequest request = new PedidoRequest(List.of(
                new ItemPedidoRequest(frappe.getIdProducto(), 1, null),
                new ItemPedidoRequest(geisha.getIdProducto(), geishaAntes + 1, null)),
                sedeRepository.findAll().get(0).getIdSede(), "DC");

        assertThatThrownBy(() -> pedidoService.crear(request, usuario))
                .isInstanceOf(StockInsuficienteException.class);

        assertThat(producto("Frappé Mocha").getStock()).isEqualTo(frappeAntes);
        assertThat(producto("Café Geisha Grano").getStock()).isEqualTo(geishaAntes);
        assertThat(ordenRepository.findByCliente_IdClienteOrderByFechaCreacionDesc(cliente.getIdCliente()))
                .isEmpty();
    }
}