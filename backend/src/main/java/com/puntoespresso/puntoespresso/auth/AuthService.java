package com.puntoespresso.puntoespresso.auth;

import com.puntoespresso.puntoespresso.dto.Cliente;
import com.puntoespresso.puntoespresso.dto.Rol;
import com.puntoespresso.puntoespresso.exception.ConflictoException;
import com.puntoespresso.puntoespresso.exception.SolicitudInvalidaException;
import com.puntoespresso.puntoespresso.repository.ClienteRepository;
import com.puntoespresso.puntoespresso.repository.UsuarioSistemaRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioSistemaRepository usuarioSistemaRepository;
    private final GoogleTokenVerifier googleTokenVerifier;

    public AuthService(AuthenticationManager authenticationManager, JwtUtil jwtUtil,
            ClienteRepository clienteRepository, PasswordEncoder passwordEncoder,
            UsuarioSistemaRepository usuarioSistemaRepository, GoogleTokenVerifier googleTokenVerifier) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.clienteRepository = clienteRepository;
        this.passwordEncoder = passwordEncoder;
        this.usuarioSistemaRepository = usuarioSistemaRepository;
        this.googleTokenVerifier = googleTokenVerifier;
    }

    public LoginResponse login(LoginRequest request) {
        var auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizar(request.email()), request.contrasena()));

        UsuarioAutenticado usuario = (UsuarioAutenticado) auth.getPrincipal();
        String token = jwtUtil.generarToken(usuario.getUsername(), usuario.getRol().name());

        return new LoginResponse(token, usuario.getNombre(), usuario.getRol().name());
    }

        // "Continuar con Google": si el correo ya tiene cuenta de cliente se reconoce; si no, se crea una.
    public LoginResponse loginConGoogle(String credencial) {
        GoogleIdentidad identidad = googleTokenVerifier.verificar(credencial);
        if (identidad.email() == null || !identidad.emailVerificado()) {
            throw new SolicitudInvalidaException("Tu cuenta de Google no tiene el correo verificado");
        }
        String email = normalizar(identidad.email());

        // Las cuentas del personal (admin y operadores) solo entran con su contraseña
        if (usuarioSistemaRepository.findByEmail(email).isPresent()) {
            throw new ConflictoException("Esta cuenta es del personal. Inicia sesión con tu correo y contraseña.");
        }

        Cliente cliente = clienteRepository.findByEmail(email).orElseGet(() -> {
            String nombre = (identidad.nombre() == null || identidad.nombre().isBlank())
                    ? email.substring(0, email.indexOf('@'))
                    : identidad.nombre().trim();
            // La cuenta nace sin DNI ni teléfono y con una contraseña aleatoria que nadie conoce
            return clienteRepository.save(new Cliente(nombre, null, email,
                    passwordEncoder.encode(UUID.randomUUID().toString()), null));
        });

        String token = jwtUtil.generarToken(cliente.getEmail(), Rol.CLIENTE.name());
        return new LoginResponse(token, cliente.getNombre(), Rol.CLIENTE.name());
    }

    public boolean emailYaRegistrado(String email) {
        String normalizado = normalizar(email);
        return clienteRepository.findByEmail(normalizado).isPresent()
                || usuarioSistemaRepository.findByEmail(normalizado).isPresent();
    }

    public boolean dniYaRegistrado(String dni) {
        return clienteRepository.existsByDni(dni.trim());
    }

    private String normalizar(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    public void registrarCliente(RegistroClienteRequest request) {
        Cliente cliente = new Cliente(
                request.nombre().trim(),
                request.dni().trim(),
                normalizar(request.email()),
                passwordEncoder.encode(request.contrasena()),
                request.telefono().trim());
        clienteRepository.save(cliente);
    }
}