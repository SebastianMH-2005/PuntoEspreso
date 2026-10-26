package com.puntoespresso.puntoespresso.service;

import com.puntoespresso.puntoespresso.admin.DashboardResponse;
import com.puntoespresso.puntoespresso.admin.DashboardResponse.ProductoStockBajo;
import com.puntoespresso.puntoespresso.admin.DashboardResponse.ProductoVendido;
import com.puntoespresso.puntoespresso.admin.DashboardResponse.VentaDia;
import com.puntoespresso.puntoespresso.dto.Orden;
import com.puntoespresso.puntoespresso.dto.OrdenDetalle;
import com.puntoespresso.puntoespresso.repository.OrdenDetalleRepository;
import com.puntoespresso.puntoespresso.repository.OrdenRepository;
import com.puntoespresso.puntoespresso.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private static final String CANCELADO = "CANCELADO";
    private static final int LIMITE_STOCK_BAJO = 5;
    private static final int MAX_STOCK_BAJO_MOSTRADOS = 10;
    private static final int TOP_PRODUCTOS = 5;

    private final OrdenRepository ordenRepository;
    private final OrdenDetalleRepository ordenDetalleRepository;
    private final ProductoRepository productoRepository;

    public DashboardService(OrdenRepository ordenRepository, OrdenDetalleRepository ordenDetalleRepository,
                            ProductoRepository productoRepository) {
        this.ordenRepository = ordenRepository;
        this.ordenDetalleRepository = ordenDetalleRepository;
        this.productoRepository = productoRepository;
    }

    /**
     * Resumen de ventas de los últimos {@code dias} días (incluye hoy). Las órdenes canceladas no
     * cuentan como venta. "Hoy" depende de la zona horaria del servidor (variable TZ en Render).
     */
    @Transactional(readOnly = true)
    public DashboardResponse resumen(int dias) {
        LocalDate hoy = LocalDate.now();
        LocalDate primerDia = hoy.minusDays(dias - 1L);
        LocalDateTime desde = primerDia.atStartOfDay();

        List<Orden> delPeriodo = ordenRepository.buscarDesde(desde);
        List<Orden> vigentes = delPeriodo.stream()
                .filter(o -> o.getFechaCreacion() != null
                        && !CANCELADO.equals(o.getEstado())
                        && !o.getFechaCreacion().toLocalDate().isAfter(hoy))
                .toList();
        int cancelados = (int) delPeriodo.stream().filter(o -> CANCELADO.equals(o.getEstado())).count();

        Map<LocalDate, List<Orden>> porDia = vigentes.stream()
                .collect(Collectors.groupingBy(o -> o.getFechaCreacion().toLocalDate()));
        List<VentaDia> ventasPorDia = new ArrayList<>();
        for (LocalDate dia = primerDia; !dia.isAfter(hoy); dia = dia.plusDays(1)) {
            List<Orden> delDia = porDia.getOrDefault(dia, List.of());
            ventasPorDia.add(new VentaDia(dia, delDia.size(), sumar(delDia)));
        }
        VentaDia ultimoDia = ventasPorDia.get(ventasPorDia.size() - 1);

        double ventasPeriodo = sumar(vigentes);
        double ticketPromedio = vigentes.isEmpty() ? 0 : redondear(ventasPeriodo / vigentes.size());

        return new DashboardResponse(
                dias,
                ultimoDia.pedidos(),
                ultimoDia.total(),
                vigentes.size(),
                ventasPeriodo,
                ticketPromedio,
                cancelados,
                ordenRepository.countByEstado("PENDIENTE"),
                ordenRepository.countByEstado("EN_PROCESO"),
                ordenRepository.countByEstado("LISTO"),
                ventasPorDia,
                masVendidos(desde),
                stockBajo());
    }

    private List<ProductoVendido> masVendidos(LocalDateTime desde) {
        Map<Integer, List<OrdenDetalle>> porProducto = ordenDetalleRepository.buscarVigentesDesde(desde).stream()
                .collect(Collectors.groupingBy(d -> d.getProducto().getIdProducto()));

        return porProducto.values().stream()
                .map(detalles -> new ProductoVendido(
                        detalles.get(0).getProducto().getNombre(),
                        detalles.stream().mapToLong(OrdenDetalle::getCantidad).sum(),
                        redondear(detalles.stream()
                                .mapToDouble(d -> d.getCantidad() * d.getPrecioUnitario())
                                .sum())))
                .sorted(Comparator.comparingLong(ProductoVendido::unidades).reversed()
                        .thenComparing(ProductoVendido::nombre))
                .limit(TOP_PRODUCTOS)
                .toList();
    }

    private List<ProductoStockBajo> stockBajo() {
        return productoRepository.findByStockLessThanEqualOrderByStockAscNombreAsc(LIMITE_STOCK_BAJO).stream()
                .limit(MAX_STOCK_BAJO_MOSTRADOS)
                .map(p -> new ProductoStockBajo(p.getIdProducto(), p.getNombre(), p.getStock()))
                .toList();
    }

    private double sumar(List<Orden> ordenes) {
        return redondear(ordenes.stream().mapToDouble(Orden::getTotal).sum());
    }

    private double redondear(double valor) {
        return Math.round(valor * 100.0) / 100.0;
    }
}