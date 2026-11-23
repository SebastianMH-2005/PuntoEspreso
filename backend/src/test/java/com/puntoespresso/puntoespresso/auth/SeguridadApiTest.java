package com.puntoespresso.puntoespresso.auth;

import com.puntoespresso.puntoespresso.entity.Cliente;
import com.puntoespresso.puntoespresso.entity.Rol;
import com.puntoespresso.puntoespresso.entity.UsuarioSistema;
import com.puntoespresso.puntoespresso.repository.ClienteRepository;
import com.puntoespresso.puntoespresso.repository.UsuarioSistemaRepository;
import jakarta.servlet.Filter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.RequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@SpringBootTest
class SeguridadApiTest {

    private static final String ADMIN_EMAIL = "admin@puntoespresso.pe";

    @Autowired
    WebApplicationContext context;
    @Autowired
    JwtUtil jwtUtil;
    @Autowired
    ClienteRepository clienteRepository;
    @Autowired
    UsuarioSistemaRepository usuarioSistemaRepository;
    @Autowired
    PasswordEncoder passwordEncoder;

    private MockMvc mvc;
    private Cliente cliente;
    private UsuarioSistema operador;

    @BeforeEach
    void preparar() {
        // MockMvc con la cadena real de Spring Security (filtro JWT incluido)
        Filter seguridad = context.getBean("springSecurityFilterChain", Filter.class);
        mvc = MockMvcBuilders.webAppContextSetup(context).addFilters(seguridad).build();

        cliente = clienteRepository.save(new Cliente("Cliente Seguridad", "11112222",
                "seguridad.cliente@test.pe", passwordEncoder.encode("Cliente123"), "911111111"));
        operador = usuarioSistemaRepository.save(new UsuarioSistema("Operador Pruebas",
                "operador.pruebas@test.pe", passwordEncoder.encode("Operador123"), Rol.OPERADOR));
    }

    @AfterEach
    void limpiar() {
        clienteRepository.delete(cliente);
        usuarioSistemaRepository.delete(operador);
    }

    private String bearer(String email, Rol rol) {
        return "Bearer " + jwtUtil.generarToken(email, rol.name());
    }

    private int estado(RequestBuilder peticion) throws Exception {
        return mvc.perform(peticion).andReturn().getResponse().getStatus();
    }

    @Test
    void elCatalogoEsPublico() throws Exception {
        assertThat(estado(get("/api/productos"))).isEqualTo(200);
    }

    @Test
    void sinTokenElPanelAdminDa401() throws Exception {
        assertThat(estado(get("/api/admin/ordenes"))).isEqualTo(401);
    }

    @Test
    void unTokenFalsoDa401() throws Exception {
        assertThat(estado(get("/api/admin/ordenes").header("Authorization", "Bearer esto.no.es.un.token")))
                .isEqualTo(401);
    }

    @Test
    void unClienteNoEntraAlPanelAdmin() throws Exception {
        String token = bearer(cliente.getEmail(), Rol.CLIENTE);

        assertThat(estado(get("/api/admin/ordenes").header("Authorization", token))).isEqualTo(403);
    }

    @Test
    void elOperadorVeLasOrdenesPeroNoLosProductos() throws Exception {
        String token = bearer(operador.getEmail(), Rol.OPERADOR);

        assertThat(estado(get("/api/admin/ordenes").header("Authorization", token))).isEqualTo(200);
        assertThat(estado(get("/api/admin/productos").header("Authorization", token))).isEqualTo(403);
    }

    @Test
    void elAdminEntraATodoElPanel() throws Exception {
        String token = bearer(ADMIN_EMAIL, Rol.ADMIN);

        assertThat(estado(get("/api/admin/ordenes").header("Authorization", token))).isEqualTo(200);
        assertThat(estado(get("/api/admin/productos").header("Authorization", token))).isEqualTo(200);
        assertThat(estado(get("/api/admin/dashboard?dias=7").header("Authorization", token))).isEqualTo(200);
    }

    @Test
        void elListadoDeOrdenesEstaPaginado() throws Exception {
        String token = bearer(ADMIN_EMAIL, Rol.ADMIN);

        MvcResult resultado = mvc.perform(get("/api/admin/ordenes?page=0&size=5")
                .header("Authorization", token)).andReturn();

        assertThat(resultado.getResponse().getStatus()).isEqualTo(200);
        assertThat(resultado.getResponse().getContentAsString())
                .contains("\"contenido\"", "\"totalPaginas\"", "\"pendientes\"");
    }

    @Test
    void soloLosClientesPuedenUsarLosEndpointsDePedidos() throws Exception {
        String token = bearer(ADMIN_EMAIL, Rol.ADMIN);

        assertThat(estado(post("/api/pedidos")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))).isEqualTo(403);
    }

    @Test
    void loginCorrectoEntregaUnToken() throws Exception {
        MvcResult resultado = mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + ADMIN_EMAIL + "\",\"contrasena\":\"Admin-Pruebas-123\"}"))
                .andReturn();

        assertThat(resultado.getResponse().getStatus()).isEqualTo(200);
        assertThat(resultado.getResponse().getContentAsString()).contains("\"token\"");
    }

    @Test
        void elInicioConGoogleEsPublicoYRechazaCredencialesFalsas() throws Exception {
        assertThat(estado(post("/api/auth/google")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"credencial\":\"esto-no-es-un-token\"}"))).isEqualTo(401);
        assertThat(estado(post("/api/auth/google")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"credencial\":\"\"}"))).isEqualTo(400);
    }

    @Test
    void loginConContrasenaIncorrectaDa401() throws Exception {
        assertThat(estado(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + ADMIN_EMAIL + "\",\"contrasena\":\"incorrecta\"}")))
                .isEqualTo(401);
    }
}