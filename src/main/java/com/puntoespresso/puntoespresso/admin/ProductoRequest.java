package com.puntoespresso.puntoespresso.admin;

public record ProductoRequest(Integer idCategoria, String nombre, double precio, String descripcion, int stock, String imagen) {
}