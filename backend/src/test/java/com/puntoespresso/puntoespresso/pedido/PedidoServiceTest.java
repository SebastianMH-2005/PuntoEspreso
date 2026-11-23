package com.puntoespresso.puntoespresso.pedido;

import com.puntoespresso.puntoespresso.auth.UsuarioAutenticado;
import com.puntoespresso.puntoespresso.entity.Cliente;
import com.puntoespresso.puntoespresso.entity.Producto;
import com.puntoespresso.puntoespresso.entity.Rol;
import com.puntoespresso.puntoespresso.entity.Sede;
import com.puntoespresso.puntoespresso.exception.ConflictoException;
import com.puntoespresso.puntoespresso.exception.RecursoNoEncontradoException;
import com.puntoespresso.puntoespresso.repository.ClienteRepository;
import com.puntoespresso.puntoespresso.repository.ProductoRepository;
import com.puntoespresso.puntoespresso.repository.SedeRepository;
import com.puntoespresso.puntoespresso.service.OrdenService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// Cada prueba corre dentro de una transacción que se deshace al terminar:
// no deja datos sueltos y todas parten de los datos del DataSeeder.
@SpringBootTest
@Transactional
class PedidoServiceTest {

    @Autowired
    PedidoService pedidoService;
    @Autowired
    OrdenService ordenService;
    @Autowired
    ProductoRepository productoRepository;
    @Autowired
    ClienteRepository clienteRepository;
    @Autowired
    SedeRepository sedeRepository;
    @PersistenceContext
    EntityManager em;

    private UsuarioAutenticado cliente;
    private Sede sede;
    private int idAmericano;
    private int idColdBrew;
    private int idGeisha;

    @BeforeEach
    void preparar() {
        Cliente c = clienteRepository.save(
                new Cliente("Cliente Prueba", "12345678", "cliente.prueba@test.pe", "hash", "987654321"));
        cliente = new UsuarioAutenticado(c.getIdCliente(), c.getNombre(), c.getEmail(), "hash", Rol.CLIENTE);
        sede = sedeRepository.findAll().get(0);
        idAmericano = idDe("Café Americano");
        idColdBrew = idDe("Cold Brew");
        idGeisha = idDe("Café Geisha Grano");
    }

    private int idDe(String nombre) {
        return productoRepository.findAll().stream()
                .filter(p -> nombre.equals(p.getNombre()))
                .findFirst().orElseThrow().getIdProducto();
    }

    // El descuento de stock es un UPDATE directo: se limpia la caché para leer el valor real
    private int stockDe(int idProducto) {
        em.flush();
        em.clear();
        return productoRepository.findById(idProducto).orElseThrow().getStock();
    }

    private PedidoRequest pedido(ItemPedidoRequest... items) {
        return new PedidoRequest(List.of(items), sede.getIdSede(), "CC");
    }

    @Test
    void crearPedidoDescuentaStockYCalculaElTotal() {
        int americanoAntes = stockDe(idAmericano);
        int coldBrewAntes = stockDe(idColdBrew);

        PedidoResponse respuesta = pedidoService.crear(pedido(
                new ItemPedidoRequest(idAmericano, 2, null),
                new ItemPedidoRequest(idColdBrew, 1, "sin azúcar")), cliente);

        assertThat(respuesta.codigoUnico()).startsWith("PE-");
        assertThat(respuesta.total()).isEqualByComparingTo("30.50");
        assertThat(respuesta.detalles()).hasSize(2);
        assertThat(stockDe(idAmericano)).isEqualTo(americanoAntes - 2);
        assertThat(stockDe(idColdBrew)).isEqualTo(coldBrewAntes - 1);
    }

    @Test
    void lineasRepetidasDelMismoProductoSeUnen() {
        PedidoResponse respuesta = pedidoService.crear(pedido(
                new ItemPedidoRequest(idAmericano, 1, null),
                new ItemPedidoRequest(idAmericano, 2, null)), cliente);

        assertThat(respuesta.detalles()).hasSize(1);
        assertThat(respuesta.detalles().get(0).cantidad()).isEqualTo(3);
        assertThat(respuesta.total()).isEqualByComparingTo("25.50");
    }

    @Test
    void siNoHayStockSuficienteElPedidoSeRechaza() {
        int pedirDeMas = stockDe(idGeisha) + 1;

        assertThatThrownBy(() -> pedidoService.crear(
                pedido(new ItemPedidoRequest(idGeisha, pedirDeMas, null)), cliente))
                .isInstanceOf(StockInsuficienteException.class)
                .hasMessageContaining("Café Geisha Grano");
    }

    @Test
    void soloLosClientesPuedenCrearPedidos() {
        UsuarioAutenticado admin = new UsuarioAutenticado(1, "Admin", "admin@puntoespresso.pe", "x", Rol.ADMIN);

        assertThatThrownBy(() -> pedidoService.crear(
                pedido(new ItemPedidoRequest(idAmericano, 1, null)), admin))
                .isInstanceOf(RolNoPermitidoException.class);
    }

    @Test
    void laSedeDebeExistir() {
        PedidoRequest sinSede = new PedidoRequest(
                List.of(new ItemPedidoRequest(idAmericano, 1, null)), 99999, "CC");

        assertThatThrownBy(() -> pedidoService.crear(sinSede, cliente))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    void cancelarUnPedidoPendienteReponeElStock() {
        int antes = stockDe(idAmericano);
        pedidoService.crear(pedido(new ItemPedidoRequest(idAmericano, 3, null)), cliente);
        assertThat(stockDe(idAmericano)).isEqualTo(antes - 3);

        int idOrden = ordenService.listarDelCliente(cliente).get(0).idOrden();
        MiOrdenResponse cancelada = ordenService.cancelarDelCliente(idOrden, cliente);

        assertThat(cancelada.estado()).isEqualTo("CANCELADO");
        assertThat(stockDe(idAmericano)).isEqualTo(antes);
    }

    @Test
    void unClienteNoPuedeCancelarElPedidoDeOtro() {
        pedidoService.crear(pedido(new ItemPedidoRequest(idAmericano, 1, null)), cliente);
        int idOrden = ordenService.listarDelCliente(cliente).get(0).idOrden();

        Cliente otro = clienteRepository.save(
                new Cliente("Otro Cliente", "22223333", "otro.cliente@test.pe", "hash", "922222222"));
        UsuarioAutenticado intruso = new UsuarioAutenticado(
                otro.getIdCliente(), otro.getNombre(), otro.getEmail(), "hash", Rol.CLIENTE);

        assertThatThrownBy(() -> ordenService.cancelarDelCliente(idOrden, intruso))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    void unPedidoEnProcesoYaNoSePuedeCancelar() {
        pedidoService.crear(pedido(new ItemPedidoRequest(idAmericano, 1, null)), cliente);
        int idOrden = ordenService.listarDelCliente(cliente).get(0).idOrden();
        ordenService.cambiarEstado(idOrden, "EN_PROCESO", null);

        assertThatThrownBy(() -> ordenService.cancelarDelCliente(idOrden, cliente))
                .isInstanceOf(ConflictoException.class);
    }

       @Test
    void elDineroSeGuardaYSeSumaSinErroresDeRedondeo() {
        Producto producto = productoRepository.save(new Producto(
                productoRepository.findAll().get(0).getCategoria(),
                "Producto de Prueba", new BigDecimal("19.99"), "Solo para pruebas", 10, "prueba.jpg"));

        PedidoResponse respuesta = pedidoService.crear(
                pedido(new ItemPedidoRequest(producto.getIdProducto(), 3, null)), cliente);
        assertThat(respuesta.total()).isEqualByComparingTo("59.97");

        // Se vuelve a leer desde la base para comprobar que la columna guarda los 2 decimales
        em.flush();
        em.clear();
        MiOrdenResponse guardada = ordenService.listarDelCliente(cliente).get(0);
        assertThat(guardada.total()).isEqualByComparingTo("59.97");
        assertThat(guardada.detalles().get(0).precioUnitario()).isEqualByComparingTo("19.99");
    }

    // Comprueba la corrección 6 de la revisión (transiciones de estado)
    @Test
    void elEstadoSoloAvanzaEnElOrdenPermitido() {
        pedidoService.crear(pedido(new ItemPedidoRequest(idAmericano, 1, null)), cliente);
        int idOrden = ordenService.listarDelCliente(cliente).get(0).idOrden();

        assertThatThrownBy(() -> ordenService.cambiarEstado(idOrden, "ENTREGADO", null))
                .isInstanceOf(ConflictoException.class);

        ordenService.cambiarEstado(idOrden, "EN_PROCESO", null);
        ordenService.cambiarEstado(idOrden, "LISTO", null);
        ordenService.cambiarEstado(idOrden, "ENTREGADO", null);

        assertThatThrownBy(() -> ordenService.cambiarEstado(idOrden, "CANCELADO", null))
                .isInstanceOf(ConflictoException.class);
    }
}