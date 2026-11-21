package com.puntoespresso.puntoespresso.admin;

import java.util.List;

// Una página del listado de órdenes del panel, más el total de pendientes de todo el sistema
public record PaginaOrdenesResponse(
        List<OrdenAdminResponse> contenido,
        int pagina,
        int tamano,
        long totalElementos,
        int totalPaginas,
        long pendientes) {
}