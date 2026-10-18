package com.puntoespresso.puntoespresso.pedido;

import com.puntoespresso.puntoespresso.auth.UsuarioAutenticado;
import com.puntoespresso.puntoespresso.service.OrdenService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos/mis-ordenes")
public class MisPedidosController {

    private final OrdenService ordenService;

    public MisPedidosController(OrdenService ordenService) {
        this.ordenService = ordenService;
    }

    @GetMapping
    public List<MiOrdenResponse> listar(@AuthenticationPrincipal UsuarioAutenticado usuario) {
        return ordenService.listarDelCliente(usuario);
    }

    @GetMapping("/{id}")
    public MiOrdenResponse detalle(@PathVariable int id, @AuthenticationPrincipal UsuarioAutenticado usuario) {
        return ordenService.obtenerDelCliente(id, usuario);
    }

    @PutMapping("/{id}/cancelar")
    public MiOrdenResponse cancelar(@PathVariable int id, @AuthenticationPrincipal UsuarioAutenticado usuario) {
        return ordenService.cancelarDelCliente(id, usuario);
    }
}