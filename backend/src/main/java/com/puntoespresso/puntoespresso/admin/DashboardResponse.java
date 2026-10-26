package com.puntoespresso.puntoespresso.admin;

import java.time.LocalDate;
import java.util.List;

public record DashboardResponse(
        int dias,
        int pedidosHoy,
        double ventasHoy,
        int pedidosPeriodo,
        double ventasPeriodo,
        double ticketPromedio,
        int canceladosPeriodo,
        long pendientes,
        long enProceso,
        long listos,
        List<VentaDia> ventasPorDia,
        List<ProductoVendido> masVendidos,
        List<ProductoStockBajo> stockBajo) {

    public record VentaDia(LocalDate fecha, int pedidos, double total) {
    }

    public record ProductoVendido(String nombre, long unidades, double ingresos) {
    }

    public record ProductoStockBajo(Integer idProducto, String nombre, int stock) {
    }
}