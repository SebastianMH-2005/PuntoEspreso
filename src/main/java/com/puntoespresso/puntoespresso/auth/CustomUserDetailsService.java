package com.puntoespresso.puntoespresso.auth;

import com.puntoespresso.puntoespresso.dto.Cliente;
import com.puntoespresso.puntoespresso.dto.UsuarioSistema;
import com.puntoespresso.puntoespresso.repository.ClienteRepository;
import com.puntoespresso.puntoespresso.repository.UsuarioSistemaRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioSistemaRepository usuarioSistemaRepository;
    private final ClienteRepository clienteRepository;

    public CustomUserDetailsService(UsuarioSistemaRepository usuarioSistemaRepository, ClienteRepository clienteRepository) {
        this.usuarioSistemaRepository = usuarioSistemaRepository;
        this.clienteRepository = clienteRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        var staff = usuarioSistemaRepository.findByEmail(email);
        if (staff.isPresent()) {
            UsuarioSistema u = staff.get();
            return new UsuarioAutenticado(u.getIdUsuarioSistema(), u.getNombre(), u.getEmail(), u.getContrasena(), u.getRol());
        }

        var cliente = clienteRepository.findByEmail(email);
        if (cliente.isPresent()) {
            Cliente c = cliente.get();
            return new UsuarioAutenticado(c.getIdCliente(), c.getNombre(), c.getEmail(), c.getContrasena(), "CLIENTE");
        }

        throw new UsernameNotFoundException("No existe una cuenta con ese email");
    }
}