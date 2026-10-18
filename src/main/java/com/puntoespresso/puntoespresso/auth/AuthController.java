package com.puntoespresso.puntoespresso.auth;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @PostMapping("/registro")
    public ResponseEntity<String> registro(@Valid @RequestBody RegistroClienteRequest request) {
        if (authService.emailYaRegistrado(request.email())) {
            return ResponseEntity.status(409).body("Ya existe una cuenta con ese email");
        }

        if (authService.dniYaRegistrado(request.dni())) {
            return ResponseEntity.status(409).body("Ya existe una cuenta con ese DNI");
        }

        authService.registrarCliente(request);
        return ResponseEntity.ok().build();
    }
}