package com.puntoespresso.puntoespresso.admin;

import com.puntoespresso.puntoespresso.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private static final int DIAS_MAXIMOS = 31;

    private final DashboardService dashboardService;

    public AdminDashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    // dias se ajusta al rango 1..31 en vez de rechazar el valor
    @GetMapping
    public DashboardResponse resumen(@RequestParam(defaultValue = "7") int dias) {
        return dashboardService.resumen(Math.min(Math.max(dias, 1), DIAS_MAXIMOS));
    }
}