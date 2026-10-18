package com.puntoespresso.puntoespresso.auth;

import com.puntoespresso.puntoespresso.dto.Cliente;
import com.puntoespresso.puntoespresso.repository.ClienteRepository;
import com.puntoespresso.puntoespresso.repository.UsuarioSistemaRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioSistemaRepository usuarioSistemaRepository;

    public AuthService(AuthenticationManager authenticationManager, JwtUtil jwtUtil,
            ClienteRepository clienteRepository, PasswordEncoder passwordEncoder,
            UsuarioSistemaRepository usuarioSistemaRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.clienteRepository = clienteRepository;
        this.passwordEncoder = passwordEncoder;
        this.usuarioSistemaRepository = usuarioSistemaRepository;
    }

    public LoginResponse login(LoginRequest request) {
        var auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizar(request.email()), request.contrasena()));

        UsuarioAutenticado usuario = (UsuarioAutenticado) auth.getPrincipal();
        String token = jwtUtil.generarToken(usuario.getUsername(), usuario.getRol().name());

        return new LoginResponse(token, usuario.getNombre(), usuario.getRol().name());
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