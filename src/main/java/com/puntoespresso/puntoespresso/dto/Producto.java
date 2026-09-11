package com.puntoespresso.puntoespresso.dto;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "productos")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String nombre;
    private double precio;
    private String descripcion;
    private int stock;
    private String categoria;
    private String imagen;

    // JPA exige un constructor vacío
    public Producto() {
    }

    // Constructor para crear productos nuevos (el id lo pone la base de datos)
    public Producto(String nombre, double precio, String descripcion, int stock, String categoria, String imagen) {
        this.nombre = nombre;
        this.precio = precio;
        this.descripcion = descripcion;
        this.stock = stock;
        this.categoria = categoria;
        this.imagen = imagen;
    }

    // GETTERS n SETTERS
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public double getPrecio() { return precio; }
    public void setPrecio(double precio) { this.precio = precio; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getImagen() { return imagen; }
    public void setImagen(String imagen) { this.imagen = imagen; }

    //MÉTODOSO

    // Condicional th:if en el HTML
    public boolean isDisponible() {
        return this.stock > 0;
    }

    public double getPrecioInt() {
        return (int) precio;
    }

    // Cambia color de tarjeta según producto
    public String getHeaderClass() {
        return "Café en Grano".equals(categoria) ? "bg-dark text-warning" : "bg-warning text-dark";
    }

    // Devuelve clase Bootstrap para texto disponibilidad
    public String getStockBadgeClass() {
        return isDisponible() ? "text-success" : "text-danger fw-bold";
    }
}
