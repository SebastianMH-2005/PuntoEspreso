package com.puntoespresso.puntoespresso.dto;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "ordenes")
public class Orden {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idOrden;

    @ManyToOne
    @JoinColumn(name = "id_cliente")
    private Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "id_direccion")
    private Direccion direccion;

    @ManyToOne
    @JoinColumn(name = "id_sede")
    private Sede sede;

    @ManyToOne
    @JoinColumn(name = "id_usuario_sistema")
    private UsuarioSistema usuarioSistema;

    private String tipoEntrega;
    private String metodoPago;
    private String estado;
    private String codigoUnico;
    private double total;

    public Orden() {
    }

    public Orden(Cliente cliente, Direccion direccion, Sede sede, String tipoEntrega, String metodoPago, String estado, String codigoUnico, double total) {
        this.cliente = cliente;
        this.direccion = direccion;
        this.sede = sede;
        this.tipoEntrega = tipoEntrega;
        this.metodoPago = metodoPago;
        this.estado = estado;
        this.codigoUnico = codigoUnico;
        this.total = total;
    }

    public Integer getIdOrden() { return idOrden; }
    public void setIdOrden(Integer idOrden) { this.idOrden = idOrden; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
    public Direccion getDireccion() { return direccion; }
    public void setDireccion(Direccion direccion) { this.direccion = direccion; }
    public Sede getSede() { return sede; }
    public void setSede(Sede sede) { this.sede = sede; }
    public UsuarioSistema getUsuarioSistema() { return usuarioSistema; }
    public void setUsuarioSistema(UsuarioSistema usuarioSistema) { this.usuarioSistema = usuarioSistema; }
    public String getTipoEntrega() { return tipoEntrega; }
    public void setTipoEntrega(String tipoEntrega) { this.tipoEntrega = tipoEntrega; }
    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getCodigoUnico() { return codigoUnico; }
    public void setCodigoUnico(String codigoUnico) { this.codigoUnico = codigoUnico; }
    public double getTotal() { return total; }
    public void setTotal(double total) { this.total = total; }
}