package com.puntoespresso.puntoespresso.dto;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "orden_detalle")
public class OrdenDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idOrdenDetalle;

    @ManyToOne
    @JoinColumn(name = "id_orden")
    private Orden orden;

    @ManyToOne
    @JoinColumn(name = "id_producto")
    private Producto producto;

    private int cantidad;
    private double precioUnitario;
    private String instrucciones;

    public OrdenDetalle() {
    }

    public OrdenDetalle(Orden orden, Producto producto, int cantidad, double precioUnitario, String instrucciones) {
        this.orden = orden;
        this.producto = producto;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.instrucciones = instrucciones;
    }

    public Integer getIdOrdenDetalle() { return idOrdenDetalle; }
    public void setIdOrdenDetalle(Integer idOrdenDetalle) { this.idOrdenDetalle = idOrdenDetalle; }
    public Orden getOrden() { return orden; }
    public void setOrden(Orden orden) { this.orden = orden; }
    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }
    public int getCantidad() { return cantidad; }
    public void setCantidad(int cantidad) { this.cantidad = cantidad; }
    public double getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(double precioUnitario) { this.precioUnitario = precioUnitario; }
    public String getInstrucciones() { return instrucciones; }
    public void setInstrucciones(String instrucciones) { this.instrucciones = instrucciones; }
}