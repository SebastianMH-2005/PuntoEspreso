package com.puntoespresso.puntoespresso.auth;

import com.puntoespresso.puntoespresso.dto.Cliente;
import com.puntoespresso.puntoespresso.repository.ClienteRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthenticationManager authenticationManager, JwtUtil jwtUtil,
                           ClienteRepository clienteRepository, PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.clienteRepository = clienteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        try {
            var auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.contrasena()));

            UsuarioAutenticado usuario = (UsuarioAutenticado) auth.getPrincipal();
            String token = jwtUtil.generarToken(usuario.getUsername(), usuario.getRol());

            return ResponseEntity.ok(new LoginResponse(token, usuario.getNombre(), usuario.getRol()));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @PostMapping("/registro")
    public ResponseEntity<String> registro(@RequestBody RegistroClienteRequest request) {
        if (clienteRepository.findByEmail(request.email()).isPresent()) {
            return ResponseEntity.status(409).body("Ya existe una cuenta con ese email");
        }

        Cliente cliente = new Cliente(
                request.nombre(),
                request.dni(),
                request.email(),
                passwordEncoder.encode(request.contrasena()),
                request.telefono());
        clienteRepository.save(cliente);

        return ResponseEntity.ok().build();
    }
}