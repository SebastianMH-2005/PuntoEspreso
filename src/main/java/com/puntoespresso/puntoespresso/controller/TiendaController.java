package com.puntoespresso.puntoespresso.controller;

import com.puntoespresso.puntoespresso.service.ProductoService;
import com.puntoespresso.puntoespresso.service.SedeService;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class TiendaController {

    private final ProductoService productoService;
    private final SedeService sedeService;

    public TiendaController(ProductoService productoService, SedeService sedeService) {
        this.productoService = productoService;
        this.sedeService = sedeService;
    }

    @GetMapping({"/", "/index"})
    public String index(Model model) {
        model.addAttribute("activePage", "inicio");
        return "index";
    }

    @GetMapping("/catalogo")
    public String catalogo(Model model) {
        model.addAttribute("activePage", "catalogo");
        model.addAttribute("productos", productoService.listarTodos());
        return "catalogo";
    }

    @GetMapping("/contacto")
    public String contacto(Model model) {
        model.addAttribute("activePage", "contacto");
        model.addAttribute("sedes", sedeService.listarTodas());
        return "ubicaciones";
    }

    @GetMapping("/checkout")
    public String checkout(Model model) {
        model.addAttribute("activePage", "checkout");
        return "checkout";
    }

    @GetMapping("/nosotros")
    public String nosotros(Model model) {
        model.addAttribute("activePage", "nosotros");
        return "nosotros";
    }

    @GetMapping("/registro")
    public String registro(Model model) {
        model.addAttribute("activePage", "registro");
        return "registro";
    }
}