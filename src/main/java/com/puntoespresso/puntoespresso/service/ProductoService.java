package com.puntoespresso.puntoespresso.service;

import com.puntoespresso.puntoespresso.dto.Producto;
import com.puntoespresso.puntoespresso.repository.ProductoRepository;
import org.springframework.stereotype.Service;

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
}
