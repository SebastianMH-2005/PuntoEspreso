package com.puntoespresso.puntoespresso.pedido;

import com.puntoespresso.puntoespresso.auth.UsuarioAutenticado;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final PedidoService pedidoService;

    public PedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    @PostMapping
    public PedidoResponse crear(@Valid @RequestBody PedidoRequest request,
            @AuthenticationPrincipal UsuarioAutenticado usuario) {
        return pedidoService.crear(request, usuario);
    }
}