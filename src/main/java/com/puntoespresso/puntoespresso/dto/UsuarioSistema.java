package com.puntoespresso.puntoespresso.dto;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "usuarios_sistema")
public class UsuarioSistema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idUsuarioSistema;
    private String nombre;
    private String email;
    private String contrasena;
    private String rol;

    public UsuarioSistema() {
    }

    public UsuarioSistema(String nombre, String email, String contrasena, String rol) {
        this.nombre = nombre;
        this.email = email;
        this.contrasena = contrasena;
        this.rol = rol;
    }

    public Integer getIdUsuarioSistema() { return idUsuarioSistema; }
    public void setIdUsuarioSistema(Integer idUsuarioSistema) { this.idUsuarioSistema = idUsuarioSistema; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getContrasena() { return contrasena; }
    public void setContrasena(String contrasena) { this.contrasena = contrasena; }
    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }
}