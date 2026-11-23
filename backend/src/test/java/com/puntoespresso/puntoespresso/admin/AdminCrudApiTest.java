package com.puntoespresso.puntoespresso.admin;

import com.puntoespresso.puntoespresso.auth.JwtUtil;
import com.puntoespresso.puntoespresso.entity.Rol;
import com.puntoespresso.puntoespresso.repository.CategoriaRepository;
import com.puntoespresso.puntoespresso.repository.UsuarioSistemaRepository;
import jakarta.servlet.Filter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

// Pruebas del CRUD del panel de administración (productos, sedes y personal) a través de HTTP,
// con la cadena real de seguridad: se prueban los endpoints, no solo los servicios.
// Cada prueba corre en una transacción que se deshace al terminar, así que no deja datos.
@SpringBootTest
@Transactional
class AdminCrudApiTest {

    private static final String ADMIN_EMAIL = "admin@puntoespresso.pe";

    @Autowired
    WebApplicationContext context;
    @Autowired
    JwtUtil jwtUtil;
    @Autowired
    CategoriaRepository categoriaRepository;
    @Autowired
    UsuarioSistemaRepository usuarioSistemaRepository;

    private MockMvc mvc;
    private String admin;
    private int idCategoria;

    @BeforeEach
    void preparar() {
        Filter seguridad = context.getBean("springSecurityFilterChain", Filter.class);
        mvc = MockMvcBuilders.webAppContextSetup(context).addFilters(seguridad).build();
        admin = "Bearer " + jwtUtil.generarToken(ADMIN_EMAIL, Rol.ADMIN.name());
        idCategoria = categoriaRepository.findAll().get(0).getIdCategoria();
    }

    // ---------------------------------------------------------------- ayudas

    private MockHttpServletResponse enviar(MockHttpServletRequestBuilder peticion) throws Exception {
        return mvc.perform(peticion).andReturn().getResponse();
    }

    private MockHttpServletRequestBuilder conAdmin(MockHttpServletRequestBuilder peticion) {
        return peticion.header("Authorization", admin);
    }

    private MockHttpServletRequestBuilder conCuerpo(MockHttpServletRequestBuilder peticion, String json) {
        return peticion.contentType(MediaType.APPLICATION_JSON).content(json);
    }

    private String texto(MockHttpServletResponse respuesta) throws Exception {
        return respuesta.getContentAsString(StandardCharsets.UTF_8);
    }

    private int idDe(MockHttpServletResponse respuesta, String campo) throws Exception {
        Matcher m = Pattern.compile("\"" + campo + "\"\\s*:\\s*(\\d+)").matcher(texto(respuesta));
        assertThat(m.find()).as("la respuesta debe traer %s: %s", campo, texto(respuesta)).isTrue();
        return Integer.parseInt(m.group(1));
    }

    private String productoJson(int categoria, String nombre, String precio, int stock) {
        return "{\"idCategoria\":" + categoria + ",\"nombre\":\"" + nombre + "\",\"precio\":" + precio
                + ",\"descripcion\":\"Producto creado por una prueba\",\"stock\":" + stock
                + ",\"imagen\":\"prueba.jpg\"}";
    }

    private String sedeJson(String nombre, String direccion) {
        return "{\"nombre\":\"" + nombre + "\",\"direccion\":\"" + direccion
                + "\",\"horarioDias\":\"Lunes a viernes\",\"horarioHoras\":\"8:00 - 20:00\"}";
    }

    private String operadorJson(String nombre, String email, String contrasena) {
        return "{\"nombre\":\"" + nombre + "\",\"email\":\"" + email + "\",\"contrasena\":\"" + contrasena + "\"}";
    }

    // ------------------------------------------------------------- productos

    @Test
    void sinSesionNoSePuedeCrearUnProducto() throws Exception {
        MockHttpServletResponse respuesta = enviar(conCuerpo(post("/api/admin/productos"),
                productoJson(idCategoria, "Sin Sesion", "9.50", 5)));

        assertThat(respuesta.getStatus()).isEqualTo(401);
    }

    @Test
    void crearUnProductoLoDejaVisibleEnElCatalogoPublico() throws Exception {
        MockHttpServletResponse creado = enviar(conCuerpo(conAdmin(post("/api/admin/productos")),
                productoJson(idCategoria, "Té Chai de Prueba", "9.50", 12)));

        assertThat(creado.getStatus()).isEqualTo(200);
        int id = idDe(creado, "idProducto");

        MockHttpServletResponse catalogo = enviar(get("/api/productos"));
        assertThat(catalogo.getStatus()).isEqualTo(200);
        assertThat(texto(catalogo)).contains("Té Chai de Prueba");

        MockHttpServletResponse uno = enviar(get("/api/productos/" + id));
        assertThat(uno.getStatus()).isEqualTo(200);
        assertThat(texto(uno)).contains("Té Chai de Prueba").contains("\"stock\":12");
    }

    @Test
    void actualizarUnProductoCambiaSusDatos() throws Exception {
        int id = idDe(enviar(conCuerpo(conAdmin(post("/api/admin/productos")),
                productoJson(idCategoria, "Mate de Prueba", "7.00", 5))), "idProducto");

        MockHttpServletResponse actualizado = enviar(conCuerpo(conAdmin(put("/api/admin/productos/" + id)),
                productoJson(idCategoria, "Mate Premium de Prueba", "8.50", 30)));

        assertThat(actualizado.getStatus()).isEqualTo(200);
        MockHttpServletResponse uno = enviar(get("/api/productos/" + id));
        assertThat(texto(uno)).contains("Mate Premium de Prueba").contains("\"stock\":30");
    }

    @Test
    void eliminarUnProductoLoQuitaDelCatalogo() throws Exception {
        int id = idDe(enviar(conCuerpo(conAdmin(post("/api/admin/productos")),
                productoJson(idCategoria, "Efimero de Prueba", "5.00", 3))), "idProducto");

        assertThat(enviar(conAdmin(delete("/api/admin/productos/" + id))).getStatus()).isEqualTo(200);

        assertThat(enviar(get("/api/productos/" + id)).getStatus()).isEqualTo(404);
        assertThat(texto(enviar(get("/api/productos")))).doesNotContain("Efimero de Prueba");
        // y borrarlo otra vez avisa que ya no existe
        assertThat(enviar(conAdmin(delete("/api/admin/productos/" + id))).getStatus()).isEqualTo(404);
    }

    @Test
    void unProductoConDatosInvalidosSeRechazaSinGuardarse() throws Exception {
        MockHttpServletResponse sinPrecio = enviar(conCuerpo(conAdmin(post("/api/admin/productos")),
                productoJson(idCategoria, "Invalido de Prueba", "0", 5)));
        MockHttpServletResponse sinNombre = enviar(conCuerpo(conAdmin(post("/api/admin/productos")),
                productoJson(idCategoria, "", "9.50", 5)));

        assertThat(sinPrecio.getStatus()).isEqualTo(400);
        assertThat(sinNombre.getStatus()).isEqualTo(400);
        assertThat(texto(enviar(get("/api/productos")))).doesNotContain("Invalido de Prueba");
    }

    @Test
    void unProductoConUnaCategoriaInexistenteDa404() throws Exception {
        MockHttpServletResponse respuesta = enviar(conCuerpo(conAdmin(post("/api/admin/productos")),
                productoJson(999999, "Sin Categoria", "9.50", 5)));

        assertThat(respuesta.getStatus()).isEqualTo(404);
    }

    // ----------------------------------------------------------------- sedes

    @Test
    void crearUnaSedeLaDejaVisibleEnLaListaPublica() throws Exception {
        MockHttpServletResponse creada = enviar(conCuerpo(conAdmin(post("/api/admin/sedes")),
                sedeJson("Sede de Prueba", "Av. Prueba 123")));

        assertThat(creada.getStatus()).isEqualTo(200);
        assertThat(idDe(creada, "idSede")).isPositive();
        assertThat(texto(enviar(get("/api/sedes")))).contains("Sede de Prueba");
    }

    @Test
    void actualizarUnaSedeCambiaSusDatos() throws Exception {
        int id = idDe(enviar(conCuerpo(conAdmin(post("/api/admin/sedes")),
                sedeJson("Sede Vieja", "Calle Vieja 1"))), "idSede");

        MockHttpServletResponse actualizada = enviar(conCuerpo(conAdmin(put("/api/admin/sedes/" + id)),
                sedeJson("Sede Nueva", "Calle Nueva 2")));

        assertThat(actualizada.getStatus()).isEqualTo(200);
        String lista = texto(enviar(get("/api/sedes")));
        assertThat(lista).contains("Sede Nueva").doesNotContain("Sede Vieja");
    }

    @Test
    void eliminarUnaSedeLaQuitaDeLaLista() throws Exception {
        int id = idDe(enviar(conCuerpo(conAdmin(post("/api/admin/sedes")),
                sedeJson("Sede Temporal", "Calle Temporal 3"))), "idSede");

        assertThat(enviar(conAdmin(delete("/api/admin/sedes/" + id))).getStatus()).isEqualTo(200);

        assertThat(texto(enviar(get("/api/sedes")))).doesNotContain("Sede Temporal");
        assertThat(enviar(conAdmin(delete("/api/admin/sedes/" + id))).getStatus()).isEqualTo(404);
    }

    @Test
    void unaSedeSinDatosObligatoriosSeRechaza() throws Exception {
        MockHttpServletResponse respuesta = enviar(conCuerpo(conAdmin(post("/api/admin/sedes")),
                sedeJson("", "Calle Sin Nombre 4")));

        assertThat(respuesta.getStatus()).isEqualTo(400);
    }

    // ---------------------------------------------------------------- personal

    @Test
    void elAdminCreaUnOperadorSinFiltrarSuContrasena() throws Exception {
        MockHttpServletResponse creado = enviar(conCuerpo(conAdmin(post("/api/admin/usuarios")),
                operadorJson("Operador Nuevo", "Nuevo.Operador@Test.pe", "Clave12345")));

        assertThat(creado.getStatus()).isEqualTo(200);
        String cuerpo = texto(creado);
        assertThat(cuerpo).contains("\"rol\":\"OPERADOR\"").contains("nuevo.operador@test.pe");
        // la respuesta nunca incluye la contraseña, ni siquiera cifrada
        assertThat(cuerpo).doesNotContain("contrasena").doesNotContain("Clave12345").doesNotContain("$2");
    }

    @Test
    void elOperadorCreadoPuedeIniciarSesion() throws Exception {
        enviar(conCuerpo(conAdmin(post("/api/admin/usuarios")),
                operadorJson("Operador Login", "operador.login@test.pe", "Clave12345")));

        MockHttpServletResponse login = enviar(conCuerpo(post("/api/auth/login"),
                "{\"email\":\"operador.login@test.pe\",\"contrasena\":\"Clave12345\"}"));

        assertThat(login.getStatus()).isEqualTo(200);
        assertThat(texto(login)).contains("\"token\"").contains("OPERADOR");
    }

    @Test
    void noSePuedeCrearDosVecesElMismoCorreo() throws Exception {
        String cuerpo = operadorJson("Operador Repetido", "repetido@test.pe", "Clave12345");

        assertThat(enviar(conCuerpo(conAdmin(post("/api/admin/usuarios")), cuerpo)).getStatus()).isEqualTo(200);
        assertThat(enviar(conCuerpo(conAdmin(post("/api/admin/usuarios")), cuerpo)).getStatus()).isEqualTo(409);
    }

    @Test
    void unOperadorConContrasenaCortaSeRechaza() throws Exception {
        MockHttpServletResponse respuesta = enviar(conCuerpo(conAdmin(post("/api/admin/usuarios")),
                operadorJson("Operador Corto", "corto@test.pe", "123")));

        assertThat(respuesta.getStatus()).isEqualTo(400);
    }

    @Test
    void eliminarUnOperadorLoQuitaDeLaLista() throws Exception {
        int id = idDe(enviar(conCuerpo(conAdmin(post("/api/admin/usuarios")),
                operadorJson("Operador Baja", "baja@test.pe", "Clave12345"))), "idUsuarioSistema");
        assertThat(texto(enviar(conAdmin(get("/api/admin/usuarios"))))).contains("baja@test.pe");

        assertThat(enviar(conAdmin(delete("/api/admin/usuarios/" + id))).getStatus()).isEqualTo(204);

        assertThat(texto(enviar(conAdmin(get("/api/admin/usuarios"))))).doesNotContain("baja@test.pe");
    }

    @Test
    void elAdministradorNoSePuedeEliminar() throws Exception {
        int idAdmin = usuarioSistemaRepository.findByEmail(ADMIN_EMAIL).orElseThrow().getIdUsuarioSistema();

        MockHttpServletResponse respuesta = enviar(conAdmin(delete("/api/admin/usuarios/" + idAdmin)));

        assertThat(respuesta.getStatus()).isEqualTo(409);
        assertThat(texto(enviar(conAdmin(get("/api/admin/usuarios"))))).contains(ADMIN_EMAIL);
    }
}