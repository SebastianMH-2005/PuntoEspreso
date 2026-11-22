package com.puntoespresso.puntoespresso.auth;

// Lo que Google certifica de la persona dentro de su credencial
public record GoogleIdentidad(String email, boolean emailVerificado, String nombre) {
}