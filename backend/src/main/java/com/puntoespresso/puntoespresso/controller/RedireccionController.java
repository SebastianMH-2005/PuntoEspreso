package com.puntoespresso.puntoespresso.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.net.URI;
import java.util.Map;

/** Las páginas viven ahora en el frontend (Vercel): las direcciones antiguas de Render redirigen allí. */
@Controller
public class RedireccionController {

    // Direcciones que cambiaron de nombre en el sitio nuevo
    private static final Map<String, String> RENOMBRADAS = Map.of("/index", "/", "/ubicaciones", "/contacto");

    private final String frontendUrl;

    public RedireccionController(@Value("${app.frontend-url}") String frontendUrl) {
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    @GetMapping({"/", "/index", "/catalogo", "/contacto", "/ubicaciones", "/nosotros", "/carrito",
            "/checkout", "/mis-pedidos", "/registro", "/login", "/admin"})
    public ResponseEntity<Void> aLaWeb(HttpServletRequest request) {
        String ruta = RENOMBRADAS.getOrDefault(request.getRequestURI(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.MOVED_PERMANENTLY)
                .location(URI.create(frontendUrl + ruta))
                .build();
    }
}