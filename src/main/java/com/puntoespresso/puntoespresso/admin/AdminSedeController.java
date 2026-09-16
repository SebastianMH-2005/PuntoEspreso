package com.puntoespresso.puntoespresso.admin;

import com.puntoespresso.puntoespresso.dto.Sede;
import com.puntoespresso.puntoespresso.exception.RecursoNoEncontradoException;
import com.puntoespresso.puntoespresso.service.SedeService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/sedes")
public class AdminSedeController {

    private final SedeService sedeService;

    public AdminSedeController(SedeService sedeService) {
        this.sedeService = sedeService;
    }

    @GetMapping
    public List<Sede> listar() {
        return sedeService.listarTodas();
    }

    @PostMapping
    public Sede crear(@RequestBody SedeRequest request) {
        Sede sede = new Sede(request.nombre(), request.direccion(), request.horarioDias(), request.horarioHoras());
        return sedeService.guardar(sede);
    }

    @PutMapping("/{id}")
    public Sede actualizar(@PathVariable int id, @RequestBody SedeRequest request) {
        Sede sede = sedeService.buscarPorId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe una sede con id " + id));

        sede.setNombre(request.nombre());
        sede.setDireccion(request.direccion());
        sede.setHorarioDias(request.horarioDias());
        sede.setHorarioHoras(request.horarioHoras());

        return sedeService.guardar(sede);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable int id) {
        sedeService.eliminar(id);
    }
}