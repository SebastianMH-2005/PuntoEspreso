package com.puntoespresso.puntoespresso.service;

import com.puntoespresso.puntoespresso.dto.Sede;
import com.puntoespresso.puntoespresso.repository.SedeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SedeService {

    private final SedeRepository sedeRepository;

    public SedeService(SedeRepository sedeRepository) {
        this.sedeRepository = sedeRepository;
    }

    public List<Sede> listarTodas() {
        return sedeRepository.findAll();
    }
}
