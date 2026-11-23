package com.puntoespresso.puntoespresso.auth;

import com.puntoespresso.puntoespresso.entity.Cliente;
import com.puntoespresso.puntoespresso.exception.ConflictoException;
import com.puntoespresso.puntoespresso.exception.SolicitudInvalidaException;
import com.puntoespresso.puntoespresso.repository.ClienteRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

// Google se simula: aquí se prueba la lógica de cuentas, no la conexión con Google.
@SpringBootTest
@Transactional
class GoogleLoginTest {

    @Autowired
    AuthService authService;
    @Autowired
    ClienteRepository clienteRepository;
    @Autowired
    JwtUtil jwtUtil;
    @Autowired
    PasswordEncoder passwordEncoder;
    @MockitoBean
    GoogleTokenVerifier verificador;

    private void googleDice(String email, boolean verificado, String nombre) {
        when(verificador.verificar("credencial")).thenReturn(new GoogleIdentidad(email, verificado, nombre));
    }

    private long cuentasCon(String email) {
        return clienteRepository.findAll().stream().filter(c -> email.equals(c.getEmail())).count();
    }

    @Test
    void laPrimeraVezCreaUnaCuentaDeClienteYEntregaUnToken() {
        googleDice("Nueva.Persona@Gmail.com", true, "Nueva Persona");

        LoginResponse respuesta = authService.loginConGoogle("credencial");

        assertThat(respuesta.rol()).isEqualTo("CLIENTE");
        assertThat(respuesta.nombre()).isEqualTo("Nueva Persona");
        assertThat(clienteRepository.findByEmail("nueva.persona@gmail.com")).isPresent();
        assertThat(jwtUtil.esValido(respuesta.token())).isTrue();
        assertThat(jwtUtil.extraerEmail(respuesta.token())).isEqualTo("nueva.persona@gmail.com");
        assertThat(jwtUtil.extraerRol(respuesta.token())).isEqualTo("CLIENTE");
    }

    @Test
    void lasVecesSiguientesReconoceLaMismaCuentaSinDuplicarla() {
        googleDice("repetida@gmail.com", true, "Repetida");

        authService.loginConGoogle("credencial");
        authService.loginConGoogle("credencial");

        assertThat(cuentasCon("repetida@gmail.com")).isEqualTo(1);
    }

    @Test
    void siYaExisteUnaCuentaConEseCorreoLaVinculaSinCambiarleElNombre() {
        clienteRepository.save(new Cliente("Ana Registrada", "77778888", "ana@gmail.com",
                passwordEncoder.encode("Clave1234"), "977777777"));
        googleDice("ana@gmail.com", true, "Ana de Google");

        LoginResponse respuesta = authService.loginConGoogle("credencial");

        assertThat(respuesta.nombre()).isEqualTo("Ana Registrada");
        assertThat(cuentasCon("ana@gmail.com")).isEqualTo(1);
        // su contraseña de siempre sigue funcionando
        assertThat(authService.login(new LoginRequest("ana@gmail.com", "Clave1234")).rol()).isEqualTo("CLIENTE");
    }

    @Test
    void unCorreoSinVerificarSeRechazaYNoCreaCuenta() {
        googleDice("sin.verificar@gmail.com", false, "Sin Verificar");

        assertThatThrownBy(() -> authService.loginConGoogle("credencial"))
                .isInstanceOf(SolicitudInvalidaException.class);
        assertThat(cuentasCon("sin.verificar@gmail.com")).isZero();
    }

    @Test
    void lasCuentasDelPersonalNoEntranConGoogle() {
        googleDice("admin@puntoespresso.pe", true, "Admin");

        assertThatThrownBy(() -> authService.loginConGoogle("credencial"))
                .isInstanceOf(ConflictoException.class)
                .hasMessageContaining("personal");
    }

    @Test
    void unaCredencialFalsaSeRechaza() {
        when(verificador.verificar("falsa")).thenThrow(new BadCredentialsException("Credencial de Google inválida"));

        assertThatThrownBy(() -> authService.loginConGoogle("falsa"))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void unaCuentaCreadaConGoogleNoTieneContrasenaUtilizable() {
        googleDice("solo.google@gmail.com", true, "Solo Google");
        authService.loginConGoogle("credencial");

        assertThatThrownBy(() -> authService.login(new LoginRequest("solo.google@gmail.com", "cualquier-cosa")))
                .isInstanceOf(BadCredentialsException.class);
    }
}