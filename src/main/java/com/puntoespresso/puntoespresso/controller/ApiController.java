package com.puntoespresso.puntoespresso.controller;

import com.puntoespresso.puntoespresso.dto.Categoria;
import com.puntoespresso.puntoespresso.dto.Producto;
import com.puntoespresso.puntoespresso.dto.Sede;
import com.puntoespresso.puntoespresso.exception.RecursoNoEncontradoException;
import com.puntoespresso.puntoespresso.service.CategoriaService;
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
    private final CategoriaService categoriaService;

    public ApiController(ProductoService productoService, SedeService sedeService, CategoriaService categoriaService) {
        this.productoService = productoService;
        this.sedeService = sedeService;
        this.categoriaService = categoriaService;
    }

    @GetMapping("/productos")
    public List<Producto> listarProductos() {
        return productoService.listarTodos();
    }

    @GetMapping("/productos/{id}")
    public Producto obtenerProducto(@PathVariable int id) {
        return productoService.buscarPorId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un producto con id " + id));
    }

    @GetMapping("/sedes")
    public List<Sede> listarSedes() {
        return sedeService.listarTodas();
    }

    @GetMapping("/categorias")
    public List<Categoria> listarCategorias() {
        return categoriaService.listarTodas();
    }
}