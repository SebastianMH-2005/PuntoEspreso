package com.puntoespresso.puntoespresso.repository;

import com.puntoespresso.puntoespresso.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {
}