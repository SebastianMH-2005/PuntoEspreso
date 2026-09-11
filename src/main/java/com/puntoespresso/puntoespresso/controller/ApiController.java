package com.puntoespresso.puntoespresso.controller;

import com.puntoespresso.puntoespresso.dto.Producto;
import com.puntoespresso.puntoespresso.dto.Sede;
import com.puntoespresso.puntoespresso.exception.RecursoNoEncontradoException;
import com.puntoespresso.puntoespresso.service.ProductoService;
import com.puntoespresso.puntoespresso.service.SedeService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ApiController {

    private final ProductoService productoService;
    private final SedeService sedeService;

    public ApiController(ProductoService productoService, SedeService sedeService) {
        this.productoService = productoService;
        this.sedeService = sedeService;
    }

    // Endpoint 1: carga el catálogo completo en JSON (desde la base de datos)
    @GetMapping("/productos")
    public List<Producto> listarProductos() {
        return productoService.listarTodos();
    }

    // Endpoint 1b: un producto puntual por id -> aquí se ve el manejo de errores en acción
    @GetMapping("/productos/{id}")
    public Producto obtenerProducto(@PathVariable int id) {
        return productoService.buscarPorId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un producto con id " + id));
    }

    // Endpoint 2: carga las sedes en JSON (desde la base de datos)
    @GetMapping("/sedes")
    public List<Sede> listarSedes() {
        return sedeService.listarTodas();
    }
}
