package com.puntoespresso.puntoespresso.auth;

import com.puntoespresso.puntoespresso.dto.Cliente;
import com.puntoespresso.puntoespresso.repository.ClienteRepository;
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

    public AuthService(AuthenticationManager authenticationManager, JwtUtil jwtUtil,
                        ClienteRepository clienteRepository, PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.clienteRepository = clienteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse login(LoginRequest request) {
        var auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.contrasena()));

        UsuarioAutenticado usuario = (UsuarioAutenticado) auth.getPrincipal();
        String token = jwtUtil.generarToken(usuario.getUsername(), usuario.getRol().name());

        return new LoginResponse(token, usuario.getNombre(), usuario.getRol().name());
    }

    public boolean emailYaRegistrado(String email) {
        return clienteRepository.findByEmail(email).isPresent();
    }

    public void registrarCliente(RegistroClienteRequest request) {
        Cliente cliente = new Cliente(
                request.nombre(),
                request.dni(),
                request.email(),
                passwordEncoder.encode(request.contrasena()),
                request.telefono());
        clienteRepository.save(cliente);
    }
}