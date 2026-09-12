package com.puntoespresso.puntoespresso.dto;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "productos")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idProducto;

    @ManyToOne
    @JoinColumn(name = "id_categoria")
    private Categoria categoria;

    @ManyToOne
    @JoinColumn(name = "id_usuario_sistema")
    private UsuarioSistema usuarioSistema;

    private String nombre;
    private double precio;
    private String descripcion;
    private int stock;
    private String imagen;

    public Producto() {
    }

    public Producto(Categoria categoria, String nombre, double precio, String descripcion, int stock, String imagen) {
        this.categoria = categoria;
        this.nombre = nombre;
        this.precio = precio;
        this.descripcion = descripcion;
        this.stock = stock;
        this.imagen = imagen;
    }

    public Integer getIdProducto() { return idProducto; }
    public void setIdProducto(Integer idProducto) { this.idProducto = idProducto; }
    public Categoria getCategoria() { return categoria; }
    public void setCategoria(Categoria categoria) { this.categoria = categoria; }
    public UsuarioSistema getUsuarioSistema() { return usuarioSistema; }
    public void setUsuarioSistema(UsuarioSistema usuarioSistema) { this.usuarioSistema = usuarioSistema; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public double getPrecio() { return precio; }
    public void setPrecio(double precio) { this.precio = precio; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }
    public String getImagen() { return imagen; }
    public void setImagen(String imagen) { this.imagen = imagen; }

    public boolean isDisponible() {
        return this.stock > 0;
    }

    public double getPrecioInt() {
        return (int) precio;
    }

    public String getHeaderClass() {
        return categoria != null && "Café en Grano".equals(categoria.getNombre())
                ? "bg-dark text-warning" : "bg-warning text-dark";
    }

    public String getStockBadgeClass() {
        return isDisponible() ? "text-success" : "text-danger fw-bold";
    }
}