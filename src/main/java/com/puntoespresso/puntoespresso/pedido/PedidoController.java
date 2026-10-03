package com.puntoespresso.puntoespresso.pedido;

import com.puntoespresso.puntoespresso.auth.UsuarioAutenticado;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<?> crear(@RequestBody PedidoRequest request, @AuthenticationPrincipal UsuarioAutenticado usuario) {
        try {
            return ResponseEntity.ok(pedidoService.crear(request, usuario));
        } catch (RolNoPermitidoException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (StockInsuficienteException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }
}