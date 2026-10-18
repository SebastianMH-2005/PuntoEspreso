package com.puntoespresso.puntoespresso.admin;

import com.puntoespresso.puntoespresso.dto.Rol;
import com.puntoespresso.puntoespresso.dto.UsuarioSistema;
import com.puntoespresso.puntoespresso.exception.ConflictoException;
import com.puntoespresso.puntoespresso.exception.RecursoNoEncontradoException;
import com.puntoespresso.puntoespresso.repository.ClienteRepository;
import com.puntoespresso.puntoespresso.repository.UsuarioSistemaRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/usuarios")
public class AdminUsuarioController {

    private final UsuarioSistemaRepository usuarioSistemaRepository;
    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUsuarioController(UsuarioSistemaRepository usuarioSistemaRepository,
                                  ClienteRepository clienteRepository, PasswordEncoder passwordEncoder) {
        this.usuarioSistemaRepository = usuarioSistemaRepository;
        this.clienteRepository = clienteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<UsuarioSistemaResponse> listar() {
        return usuarioSistemaRepository.findAll().stream().map(this::aRespuesta).toList();
    }

    @PostMapping
    public UsuarioSistemaResponse crearOperador(@Valid @RequestBody UsuarioSistemaRequest request) {
        String email = request.email().trim().toLowerCase();
        if (usuarioSistemaRepository.findByEmail(email).isPresent() || clienteRepository.findByEmail(email).isPresent()) {
            throw new ConflictoException("Ya existe una cuenta con ese email");
        }

        UsuarioSistema operador = usuarioSistemaRepository.save(new UsuarioSistema(
                request.nombre().trim(), email, passwordEncoder.encode(request.contrasena()), Rol.OPERADOR));
        return aRespuesta(operador);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable int id) {
        UsuarioSistema usuario = usuarioSistemaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un usuario con id " + id));
        if (usuario.getRol() != Rol.OPERADOR) {
            throw new ConflictoException("Solo se pueden eliminar operadores");
        }
        usuarioSistemaRepository.delete(usuario);
        return ResponseEntity.noContent().build();
    }

    private UsuarioSistemaResponse aRespuesta(UsuarioSistema u) {
        return new UsuarioSistemaResponse(u.getIdUsuarioSistema(), u.getNombre(), u.getEmail(), u.getRol().name());
    }
}