package com.puntoespresso.puntoespresso.service;

import com.puntoespresso.puntoespresso.dto.Producto;
import com.puntoespresso.puntoespresso.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;

    public ProductoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    public List<Producto> listarTodos() {
        return productoRepository.findAll();
    }

    public Optional<Producto> buscarPorId(int id) {
        return productoRepository.findById(id);
    }

    public Producto guardar(Producto producto) {
        return productoRepository.save(producto);
    }

    public void eliminar(int id) {
        productoRepository.deleteById(id);
    }

    @Transactional
    public boolean descontarStock(int idProducto, int cantidad) {
        return productoRepository.descontarStock(idProducto, cantidad) > 0;
    }

    @Transactional
    public void reponerStock(int idProducto, int cantidad) {
        productoRepository.reponerStock(idProducto, cantidad);
    }

    public List<Producto> listarPorCategoria(int idCategoria) {
        return productoRepository.buscarPorCategoria(idCategoria);
    }
}