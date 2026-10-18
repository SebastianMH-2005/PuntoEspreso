package com.puntoespresso.puntoespresso.repository;

import com.puntoespresso.puntoespresso.dto.UsuarioSistema;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioSistemaRepository extends JpaRepository<UsuarioSistema, Integer> {
    Optional<UsuarioSistema> findByEmail(String email);
}