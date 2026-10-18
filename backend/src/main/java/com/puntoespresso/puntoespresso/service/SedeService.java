package com.puntoespresso.puntoespresso.service;

import com.puntoespresso.puntoespresso.dto.Sede;
import com.puntoespresso.puntoespresso.repository.SedeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SedeService {

    private final SedeRepository sedeRepository;

    public SedeService(SedeRepository sedeRepository) {
        this.sedeRepository = sedeRepository;
    }

    public List<Sede> listarTodas() {
        return sedeRepository.findAll();
    }

    public Optional<Sede> buscarPorId(int id) {
        return sedeRepository.findById(id);
    }

    public Sede guardar(Sede sede) {
        return sedeRepository.save(sede);
    }

    public void eliminar(int id) {
        sedeRepository.deleteById(id);
    }
}