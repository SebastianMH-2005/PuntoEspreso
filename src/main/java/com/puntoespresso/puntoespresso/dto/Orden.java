package com.puntoespresso.puntoespresso.dto;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "ordenes")
public class Orden {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String cliente;
    private String productosResumen;
    private double total;
    private String metodoPago;
    private String estado;

    public Orden() {
    }

    // CONSTRUCTOR
    public Orden(String cliente, String productosResumen, double total, String metodoPago, String estado) {
        this.cliente = cliente;
        this.productosResumen = productosResumen;
        this.total = total;
        this.metodoPago = metodoPago;
        this.estado = estado;
    }

    // GETTERS n SETTERS
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getCliente() { return cliente; }
    public void setCliente(String cliente) { this.cliente = cliente; }

    public String getProductosResumen() { return productosResumen; }
    public void setProductosResumen(String productosResumen) { this.productosResumen = productosResumen; }

    public double getTotal() { return total; }
    public void setTotal(double total) { this.total = total; }

    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    // === MÉTODOS ESTÉTICOS INSPIRADOS EN EL PROFESOR ===

    // Formatea el precio automáticamente agregando el símbolo de la moneda nacional
    public String getTotalFormatted() {
        return String.format("S/ %.2f", total);
    }

    // Asigna un color de Bootstrap al estado usando la estructura moderna de tu profesor
    public String getEstadoBadgeClass() {
        return switch (estado) {
            case "Completada" -> "bg-success text-white";
            case "Pendiente"  -> "bg-warning text-dark";
            default           -> "bg-secondary text-white";
        };
    }
}
