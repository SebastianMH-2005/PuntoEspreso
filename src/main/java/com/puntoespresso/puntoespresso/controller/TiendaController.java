package com.puntoespresso.puntoespresso.controller;

import com.puntoespresso.puntoespresso.dto.Producto;
import com.puntoespresso.puntoespresso.service.ProductoService;
import com.puntoespresso.puntoespresso.service.SedeService;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Optional;

@Controller
public class TiendaController {

    private final ProductoService productoService;
    private final SedeService sedeService;

    public TiendaController(ProductoService productoService, SedeService sedeService) {
        this.productoService = productoService;
        this.sedeService = sedeService;
    }

    //  ENRUTAMIENTO
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

    @PostMapping("/checkout")
    public String procesarPago(
            @RequestParam("productoId") int productoId,
            @RequestParam("cantidad") int cantidad,
            @RequestParam(value = "instrucciones", required = false) String instrucciones,
            Model model) {

        Optional<Producto> productoOpt = productoService.buscarPorId(productoId);

        if (productoOpt.isEmpty()) {
            return "redirect:/catalogo";
        }

        Producto productoSeleccionado = productoOpt.get();
        double totalCalculado = productoSeleccionado.getPrecio() * cantidad;
        // Si viene vacío el cuadro de comentarios, lo maneja elegantemente
        String textoInstrucciones = (instrucciones == null || instrucciones.trim().isEmpty()) ? "Sin instrucciones adicionales" : instrucciones;

        model.addAttribute("producto", productoSeleccionado);
        model.addAttribute("cantidad", cantidad);
        model.addAttribute("instrucciones", textoInstrucciones);
        model.addAttribute("totalPagar", totalCalculado);
        model.addAttribute("activePage", "checkout");

        return "checkout";
    }

    @GetMapping("/nosotros")
    public String nosotros(Model model) {
        model.addAttribute("activePage", "nosotros");
        return "nosotros"; // Abre templates/nosotros.html
    }
}
