package com.puntoespresso.puntoespresso.auth;

public record RegistroClienteRequest(String nombre, String dni, String email, String contrasena, String telefono) {
}