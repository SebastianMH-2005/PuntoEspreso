package com.puntoespresso.puntoespresso.admin;

import com.puntoespresso.puntoespresso.dto.Categoria;
import com.puntoespresso.puntoespresso.dto.Producto;
import com.puntoespresso.puntoespresso.exception.RecursoNoEncontradoException;
import com.puntoespresso.puntoespresso.repository.CategoriaRepository;
import com.puntoespresso.puntoespresso.service.ProductoService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/productos")
public class AdminProductoController {

    private final ProductoService productoService;
    private final CategoriaRepository categoriaRepository;

    public AdminProductoController(ProductoService productoService, CategoriaRepository categoriaRepository) {
        this.productoService = productoService;
        this.categoriaRepository = categoriaRepository;
    }

    @GetMapping
    public List<Producto> listar() {
        return productoService.listarTodos();
    }

    @PostMapping
    public Producto crear(@RequestBody ProductoRequest request) {
        Categoria categoria = categoriaRepository.findById(request.idCategoria())
                .orElseThrow(() -> new RecursoNoEncontradoException("Categoría no encontrada"));
        Producto producto = new Producto(categoria, request.nombre(), request.precio(), request.descripcion(), request.stock(), request.imagen());
        return productoService.guardar(producto);
    }

    @PutMapping("/{id}")
    public Producto actualizar(@PathVariable int id, @RequestBody ProductoRequest request) {
        Producto producto = productoService.buscarPorId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un producto con id " + id));

        Categoria categoria = categoriaRepository.findById(request.idCategoria())
                .orElseThrow(() -> new RecursoNoEncontradoException("Categoría no encontrada"));

        producto.setCategoria(categoria);
        producto.setNombre(request.nombre());
        producto.setPrecio(request.precio());
        producto.setDescripcion(request.descripcion());
        producto.setStock(request.stock());
        producto.setImagen(request.imagen());

        return productoService.guardar(producto);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable int id) {
        productoService.eliminar(id);
    }
}