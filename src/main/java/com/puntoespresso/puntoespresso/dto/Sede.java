package com.puntoespresso.puntoespresso.dto;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "sedes")
public class Sede {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idSede;
    private String nombre;
    private String direccion;
    private String horarioDias;
    private String horarioHoras;

    public Sede() {
    }

    public Sede(String nombre, String direccion, String horarioDias, String horarioHoras) {
        this.nombre = nombre;
        this.direccion = direccion;
        this.horarioDias = horarioDias;
        this.horarioHoras = horarioHoras;
    }

    public Integer getIdSede() { return idSede; }
    public String getNombre() { return nombre; }
    public String getDireccion() { return direccion; }
    public String getHorarioDias() { return horarioDias; }
    public String getHorarioHoras() { return horarioHoras; }
}