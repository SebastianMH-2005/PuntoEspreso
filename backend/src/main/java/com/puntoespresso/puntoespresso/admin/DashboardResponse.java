package com.puntoespresso.puntoespresso.admin;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DashboardResponse(
        int dias,
        int pedidosHoy,
       BigDecimal ventasHoy,
        int pedidosPeriodo,
        BigDecimal ventasPeriodo,
        BigDecimal ticketPromedio,
        int canceladosPeriodo,
        long pendientes,
        long enProceso,
        long listos,
        List<VentaDia> ventasPorDia,
        List<ProductoVendido> masVendidos,
        List<ProductoStockBajo> stockBajo) {

    public record VentaDia(LocalDate fecha, int pedidos, BigDecimal total) {
    }

    public record ProductoVendido(String nombre, long unidades, BigDecimal ingresos) {
    }

    public record ProductoStockBajo(Integer idProducto, String nombre, int stock) {
    }
}