package com.puntoespresso.puntoespresso.dto;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "direcciones")
public class Direccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idDireccion;

    @ManyToOne
    @JoinColumn(name = "id_cliente")
    private Cliente cliente;

    private String alias;
    private String direccion;

    public Direccion() {
    }

    public Direccion(Cliente cliente, String alias, String direccion) {
        this.cliente = cliente;
        this.alias = alias;
        this.direccion = direccion;
    }

    public Integer getIdDireccion() { return idDireccion; }
    public void setIdDireccion(Integer idDireccion) { this.idDireccion = idDireccion; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
    public String getAlias() { return alias; }
    public void setAlias(String alias) { this.alias = alias; }
    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
}