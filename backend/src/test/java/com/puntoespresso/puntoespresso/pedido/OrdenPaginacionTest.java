package com.puntoespresso.puntoespresso.pedido;

import com.puntoespresso.puntoespresso.auth.UsuarioAutenticado;
import com.puntoespresso.puntoespresso.entity.Cliente;
import com.puntoespresso.puntoespresso.entity.Orden;
import com.puntoespresso.puntoespresso.entity.Rol;
import com.puntoespresso.puntoespresso.repository.ClienteRepository;
import com.puntoespresso.puntoespresso.repository.OrdenDetalleRepository;
import com.puntoespresso.puntoespresso.repository.OrdenRepository;
import com.puntoespresso.puntoespresso.repository.ProductoRepository;
import com.puntoespresso.puntoespresso.repository.SedeRepository;
import com.puntoespresso.puntoespresso.service.OrdenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class OrdenPaginacionTest {

    // Parte del email del cliente de prueba, en minúsculas (así llega la búsqueda desde el controlador)
    private static final String BUSQUEDA = "paginacion.test";

    @Autowired
    PedidoService pedidoService;
    @Autowired
    OrdenService ordenService;
    @Autowired
    OrdenRepository ordenRepository;
    @Autowired
    OrdenDetalleRepository ordenDetalleRepository;
    @Autowired
    ClienteRepository clienteRepository;
    @Autowired
    SedeRepository sedeRepository;
    @Autowired
    ProductoRepository productoRepository;

    @BeforeEach
    void crearTresPedidos() {
        Cliente c = clienteRepository.save(
                new Cliente("Lucía Paginación", "33334444", "lucia.paginacion.test@test.pe", "hash", "933333333"));
        UsuarioAutenticado cliente = new UsuarioAutenticado(
                c.getIdCliente(), c.getNombre(), c.getEmail(), "hash", Rol.CLIENTE);
        int idSede = sedeRepository.findAll().get(0).getIdSede();
        int idProducto = productoRepository.findAll().stream()
                .filter(p -> "Café Americano".equals(p.getNombre()))
                .findFirst().orElseThrow().getIdProducto();

        for (int i = 0; i < 3; i++) {
            pedidoService.crear(new PedidoRequest(
                    List.of(new ItemPedidoRequest(idProducto, 1, null)), idSede, "CC"), cliente);
        }
    }

    @Test
    void laPaginaTraeLasMasRecientesPrimero() {
        Page<Orden> primera = ordenRepository.buscarPagina("", BUSQUEDA, PageRequest.of(0, 2));
        Page<Orden> segunda = ordenRepository.buscarPagina("", BUSQUEDA, PageRequest.of(1, 2));

        assertThat(primera.getTotalElements()).isEqualTo(3);
        assertThat(primera.getTotalPages()).isEqualTo(2);
        assertThat(primera.getContent()).hasSize(2);
        assertThat(segunda.getContent()).hasSize(1);
        assertThat(primera.getContent().get(0).getIdOrden())
                .isGreaterThan(primera.getContent().get(1).getIdOrden());
        assertThat(primera.getContent().get(1).getIdOrden())
                .isGreaterThan(segunda.getContent().get(0).getIdOrden());
    }

    @Test
    void filtraPorEstado() {
        int idOrden = ordenRepository.buscarPagina("", BUSQUEDA, PageRequest.of(0, 1))
                .getContent().get(0).getIdOrden();
        ordenService.cambiarEstado(idOrden, "EN_PROCESO", null);

        assertThat(ordenRepository.buscarPagina("EN_PROCESO", BUSQUEDA, PageRequest.of(0, 10))
                .getTotalElements()).isEqualTo(1);
        assertThat(ordenRepository.buscarPagina("PENDIENTE", BUSQUEDA, PageRequest.of(0, 10))
                .getTotalElements()).isEqualTo(2);
    }

    @Test
    void buscaPorCodigoSinDistinguirMayusculas() {
        Orden una = ordenRepository.buscarPagina("", BUSQUEDA, PageRequest.of(0, 1)).getContent().get(0);
        String codigo = una.getCodigoUnico().toLowerCase(Locale.ROOT);

        Page<Orden> resultado = ordenRepository.buscarPagina("", codigo, PageRequest.of(0, 10));

        assertThat(resultado.getTotalElements()).isEqualTo(1);
        assertThat(resultado.getContent().get(0).getIdOrden()).isEqualTo(una.getIdOrden());
    }

    @Test
    void sinCoincidenciasDevuelveUnaPaginaVacia() {
        Page<Orden> resultado = ordenRepository.buscarPagina("", "zzz-no-existe", PageRequest.of(0, 10));

        assertThat(resultado.getContent()).isEmpty();
        assertThat(resultado.getTotalElements()).isZero();
    }

    @Test
    void losDetallesDeLaPaginaSeLeenEnUnaSolaConsulta() {
        List<Integer> ids = ordenRepository.buscarPagina("", BUSQUEDA, PageRequest.of(0, 10))
                .getContent().stream().map(Orden::getIdOrden).toList();

        assertThat(ordenDetalleRepository.buscarPorOrdenes(ids))
                .hasSize(3)
                .allSatisfy(d -> assertThat(d.getProducto().getNombre()).isEqualTo("Café Americano"));
    }
}